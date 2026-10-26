using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StackedHub.Api.Contracts;
using StackedHub.Api.Options;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

public class OrderService
{
    private readonly AppDbContext _db;
    private readonly KitchenOptions _kitchen;

    public OrderService(AppDbContext db, IOptions<KitchenOptions> kitchen)
    {
        _db = db;
        _kitchen = kitchen.Value;
    }

    public async Task<Order> PlacePickupAsync(int customerId, PlaceOrderRequest request, CancellationToken cancellationToken)
    {
        var payment = Enum.IsDefined(request.PaymentMethod) ? request.PaymentMethod : PaymentMethod.Cash;
        if (payment is not PaymentMethod.Cash and not PaymentMethod.Card)
        {
            throw new InvalidOperationException("Choose Cash or Card as the collection method. StackedHub does not take card settlement online.");
        }

        var idempotencyKey = NormalizeIdempotencyKey(request.IdempotencyKey);
        var requestHash = HashRequest(request);
        if (idempotencyKey is not null)
        {
            var replay = await FindIdempotentOrder(customerId, idempotencyKey, requestHash, cancellationToken);
            if (replay is not null)
            {
                return replay;
            }
        }

        DateTime? scheduledFor = request.ScheduledFor is null
            ? null
            : await NormalizeSchedule(request.ScheduledFor.Value, cancellationToken);

        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        var items = new List<OrderItem>();
        decimal total = 0;

        foreach (var line in request.Items)
        {
            if (!int.TryParse(line.MenuItemId, out var menuItemId))
            {
                throw new InvalidOperationException("Menu item id is invalid.");
            }

            var menuItem = await _db.MenuItems.FirstOrDefaultAsync(x => x.Id == menuItemId, cancellationToken)
                ?? throw new InvalidOperationException("A menu item in the cart no longer exists.");
            if (!menuItem.Available || (scheduledFor is null && menuItem.Stock < line.Quantity))
            {
                throw new InvalidOperationException($"{menuItem.Name} is unavailable and cannot be ordered.");
            }

            if (scheduledFor is null)
            {
                menuItem.Stock -= line.Quantity;
                if (menuItem.Stock <= 0)
                {
                    menuItem.Available = false;
                }
            }

            var subtotal = menuItem.Price * line.Quantity;
            total += subtotal;
            int? addedById = int.TryParse(line.AddedByCustomerId, out var parsedAddedBy) ? parsedAddedBy : null;
            string? addedByName = null;
            if (addedById is not null)
            {
                var contributor = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == addedById.Value, cancellationToken);
                addedByName = contributor?.Name;
            }

            items.Add(new OrderItem
            {
                MenuItemId = menuItem.Id,
                Name = menuItem.Name,
                Quantity = line.Quantity,
                UnitPrice = menuItem.Price,
                Subtotal = subtotal,
                SpecialInstructions = string.IsNullOrWhiteSpace(line.SpecialInstructions) ? null : line.SpecialInstructions.Trim(),
                AddedByCustomerId = addedById,
                AddedByName = addedByName
            });
        }

        var order = new Order
        {
            CustomerId = customerId,
            Status = scheduledFor is null ? OrderStatus.Placed : OrderStatus.Scheduled,
            Channel = request.Channel ?? OrderChannel.Website,
            PaymentMethod = payment,
            Total = total,
            SpecialInstructions = string.IsNullOrWhiteSpace(request.SpecialInstructions) ? null : request.SpecialInstructions.Trim(),
            ScheduledFor = scheduledFor,
            PrepLeadMinutes = _kitchen.PrepLeadMinutes,
            Items = items
        };
        RecordHistory(order, order.Status, customerId, scheduledFor is null ? "Order placed." : "Order scheduled for collection.");

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);
        order.Reference = $"#{4800 + order.Id}";

        if (idempotencyKey is not null)
        {
            _db.IdempotencyRecords.Add(new IdempotencyRecord
            {
                CustomerId = customerId,
                Key = idempotencyKey,
                RequestHash = requestHash,
                OrderId = order.Id
            });
        }

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException) when (idempotencyKey is not null)
        {
            await transaction.RollbackAsync(cancellationToken);
            var replay = await FindIdempotentOrder(customerId, idempotencyKey, requestHash, cancellationToken);
            if (replay is not null)
            {
                return replay;
            }

            throw;
        }

        return await LoadOrder(order.Id, cancellationToken) ?? order;
    }

    public Task<Order?> LoadOrder(int id, CancellationToken cancellationToken) =>
        _db.Orders
            .Include(x => x.Items)
            .Include(x => x.Customer)
            .Include(x => x.StatusHistory)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<List<Order>> ForCustomer(int customerId, CancellationToken cancellationToken) =>
        _db.Orders.Include(x => x.Items).Include(x => x.Customer)
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);

    public Task<List<Order>> Queue(OrderStatus? status, CancellationToken cancellationToken)
    {
        var query = _db.Orders.Include(x => x.Items).Include(x => x.Customer).AsQueryable();
        if (status is not null)
        {
            query = query.Where(x => x.Status == status);
        }
        else
        {
            query = query.Where(x => x.Status != OrderStatus.Scheduled);
        }

        return query.OrderByDescending(x => x.PlacedAt).ToListAsync(cancellationToken);
    }

    public async Task<List<OrderSlotDto>> ListSlots(DateTime? from, DateTime? to, CancellationToken cancellationToken)
    {
        var tz = _kitchen.ResolveTimeZone();
        var now = DateTime.UtcNow;
        var windowStart = from is null ? now.AddMinutes(_kitchen.MinScheduleAheadMinutes) : ToUtc(from.Value, tz);
        var windowEnd = to is null ? now.AddDays(_kitchen.MaxScheduleAheadDays) : ToUtc(to.Value, tz);
        if (windowEnd <= windowStart)
        {
            return [];
        }

        var earliest = now.AddMinutes(_kitchen.MinScheduleAheadMinutes);
        var latest = now.AddDays(_kitchen.MaxScheduleAheadDays);
        if (windowStart < earliest)
        {
            windowStart = earliest;
        }

        if (windowEnd > latest)
        {
            windowEnd = latest;
        }

        var booked = await _db.Orders
            .Where(x => x.ScheduledFor != null && x.Status != OrderStatus.Cancelled)
            .Select(x => x.ScheduledFor!.Value)
            .ToListAsync(cancellationToken);

        var slots = new List<OrderSlotDto>();
        var cursor = SnapToSlot(windowStart, _kitchen.SlotMinutes);
        if (cursor < windowStart)
        {
            cursor = cursor.AddMinutes(_kitchen.SlotMinutes);
        }

        while (cursor < windowEnd)
        {
            var local = TimeZoneInfo.ConvertTimeFromUtc(cursor, tz);
            var end = cursor.AddMinutes(_kitchen.SlotMinutes);
            var open = TimeSpan.FromHours(_kitchen.OpenHour);
            var close = TimeSpan.FromHours(_kitchen.CloseHour);
            var insideHours = local.TimeOfDay >= open && local.TimeOfDay.Add(TimeSpan.FromMinutes(_kitchen.SlotMinutes)) <= close;
            var count = booked.Count(x => x >= cursor && x < end);
            var remaining = Math.Max(0, _kitchen.MaxOrdersPerSlot - count);
            if (insideHours)
            {
                slots.Add(new OrderSlotDto(cursor, end, _kitchen.MaxOrdersPerSlot, count, remaining, remaining > 0));
            }

            cursor = end;
        }

        return slots;
    }

    public async Task<int> ReleaseDueScheduledOrders(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var dueIds = await _db.Orders
            .Where(x => x.Status == OrderStatus.Scheduled && x.ScheduledFor != null
                && x.ScheduledFor <= now.AddMinutes(x.PrepLeadMinutes))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var released = 0;
        foreach (var id in dueIds)
        {
            try
            {
                await UpdateStatus(id, OrderStatus.Placed, null, false, null, cancellationToken, "Scheduled order released to the kitchen.");
                released++;
            }
            catch (InvalidOperationException ex)
            {
                var order = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
                if (order is null)
                {
                    continue;
                }

                order.ReleaseError = ex.Message;
                if (order.ScheduledFor <= now)
                {
                    await UpdateStatus(id, OrderStatus.Cancelled, null, false, null, cancellationToken, "Cancelled because stock was unavailable at collection time.");
                }
                else
                {
                    await _db.SaveChangesAsync(cancellationToken);
                }
            }
        }

        return released;
    }

    public async Task<Order> UpdateStatus(int orderId, OrderStatus next, int? staffId, bool customerCancel, int? customerId, CancellationToken cancellationToken, string? note = null)
    {
        var order = await LoadOrder(orderId, cancellationToken)
            ?? throw new KeyNotFoundException("Order not found.");

        if (customerCancel)
        {
            if (order.CustomerId != customerId)
            {
                throw new UnauthorizedAccessException("You can only cancel your own orders.");
            }

            if (!OrderLifecycle.CustomerCanCancel(order.Status))
            {
                throw new InvalidOperationException($"This order can no longer be cancelled ({order.Status}).");
            }

            next = OrderStatus.Cancelled;
            note ??= "Cancelled by customer.";
        }
        else if (!OrderLifecycle.CanTransition(order.Status, next))
        {
            throw new InvalidOperationException($"Cannot move {order.Status} to {next}.");
        }

        if (order.Status == OrderStatus.Scheduled && next == OrderStatus.Placed)
        {
            await ReserveStock(order, cancellationToken);
            order.ReleaseError = null;
            note ??= "Scheduled order released to the kitchen.";
        }

        order.Status = next;
        if (staffId is not null)
        {
            order.StaffId ??= staffId;
        }

        if (next == OrderStatus.Completed)
        {
            await AwardLoyalty(order, cancellationToken);
        }

        RecordHistory(order, next, staffId ?? customerId, note);
        await _db.SaveChangesAsync(cancellationToken);
        return order;
    }

    private async Task AwardLoyalty(Order order, CancellationToken cancellationToken)
    {
        var alreadyAwarded = await _db.LoyaltyTransactions.AnyAsync(
            x => x.OrderId == order.Id && x.Type == "Earn",
            cancellationToken);
        if (alreadyAwarded)
        {
            return;
        }

        var points = (int)Math.Floor(order.Total / 10m);
        if (points <= 0)
        {
            return;
        }

        var customer = await _db.Users.FirstOrDefaultAsync(x => x.Id == order.CustomerId, cancellationToken);
        if (customer is null)
        {
            return;
        }

        customer.LoyaltyPoints += points;
        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            CustomerId = customer.Id,
            OrderId = order.Id,
            Points = points,
            Type = "Earn",
            Reason = "Order completed"
        });
    }

    private async Task ReserveStock(Order order, CancellationToken cancellationToken)
    {
        foreach (var line in order.Items)
        {
            var menuItem = await _db.MenuItems.FirstOrDefaultAsync(x => x.Id == line.MenuItemId, cancellationToken)
                ?? throw new InvalidOperationException($"{line.Name} is no longer on the menu.");
            if (!menuItem.Available || menuItem.Stock < line.Quantity)
            {
                throw new InvalidOperationException($"{menuItem.Name} is unavailable and cannot be released to the kitchen.");
            }

            menuItem.Stock -= line.Quantity;
            if (menuItem.Stock <= 0)
            {
                menuItem.Available = false;
            }
        }
    }

    private async Task<DateTime> NormalizeSchedule(DateTime requested, CancellationToken cancellationToken)
    {
        var tz = _kitchen.ResolveTimeZone();
        var utc = ToUtc(requested, tz);
        var now = DateTime.UtcNow;
        if (utc < now.AddMinutes(_kitchen.MinScheduleAheadMinutes))
        {
            throw new InvalidOperationException($"Scheduled collection must be at least {_kitchen.MinScheduleAheadMinutes} minutes from now.");
        }

        if (utc > now.AddDays(_kitchen.MaxScheduleAheadDays))
        {
            throw new InvalidOperationException($"Scheduled collection cannot be more than {_kitchen.MaxScheduleAheadDays} days ahead.");
        }

        var slot = SnapToSlot(utc, _kitchen.SlotMinutes);
        var local = TimeZoneInfo.ConvertTimeFromUtc(slot, tz);
        var open = TimeSpan.FromHours(_kitchen.OpenHour);
        var close = TimeSpan.FromHours(_kitchen.CloseHour);
        if (local.TimeOfDay < open || local.TimeOfDay.Add(TimeSpan.FromMinutes(_kitchen.SlotMinutes)) > close)
        {
            throw new InvalidOperationException($"Stacked Foods only accepts scheduled collection between {_kitchen.OpenHour}:00 and {_kitchen.CloseHour}:00.");
        }

        var slotEnd = slot.AddMinutes(_kitchen.SlotMinutes);
        var booked = await _db.Orders.CountAsync(
            x => x.ScheduledFor != null
                && x.ScheduledFor >= slot
                && x.ScheduledFor < slotEnd
                && x.Status != OrderStatus.Cancelled,
            cancellationToken);
        if (booked >= _kitchen.MaxOrdersPerSlot)
        {
            throw new InvalidOperationException("That collection slot is full. Choose another time.");
        }

        return slot;
    }

    private async Task<Order?> FindIdempotentOrder(int customerId, string key, string requestHash, CancellationToken cancellationToken)
    {
        var existing = await _db.IdempotencyRecords.FirstOrDefaultAsync(
            x => x.CustomerId == customerId && x.Key == key,
            cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (!string.Equals(existing.RequestHash, requestHash, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Idempotency key was reused with a different order payload.");
        }

        return await LoadOrder(existing.OrderId, cancellationToken);
    }

    private static void RecordHistory(Order order, OrderStatus status, int? actorId, string? note) =>
        order.StatusHistory.Add(new OrderStatusEvent
        {
            Status = status,
            ActorId = actorId,
            Note = note,
            At = DateTime.UtcNow
        });

    private static string? NormalizeIdempotencyKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return null;
        }

        var trimmed = key.Trim();
        if (trimmed.Length > 80)
        {
            throw new InvalidOperationException("Idempotency key must be 80 characters or fewer.");
        }

        return trimmed;
    }

    private static string HashRequest(PlaceOrderRequest request)
    {
        var payload = JsonSerializer.Serialize(new
        {
            request.PaymentMethod,
            request.SpecialInstructions,
            request.Channel,
            request.ScheduledFor,
            Items = request.Items.Select(x => new { x.MenuItemId, x.Quantity, x.SpecialInstructions })
        });
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(payload)));
    }

    private static DateTime ToUtc(DateTime value, TimeZoneInfo tz) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(value, DateTimeKind.Unspecified), tz)
        };

    private static DateTime SnapToSlot(DateTime utc, int slotMinutes)
    {
        var ticks = TimeSpan.FromMinutes(slotMinutes).Ticks;
        return new DateTime(utc.Ticks / ticks * ticks, DateTimeKind.Utc);
    }
}
