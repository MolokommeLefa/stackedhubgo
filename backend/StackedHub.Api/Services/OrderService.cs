using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

public class OrderService
{
    private readonly AppDbContext _db;

    public OrderService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Order> PlacePickupAsync(int customerId, PlaceOrderRequest request, CancellationToken cancellationToken)
    {
        var payment = Enum.IsDefined(request.PaymentMethod) ? request.PaymentMethod : PaymentMethod.Cash;
        if (payment is not PaymentMethod.Cash and not PaymentMethod.Card)
        {
            throw new InvalidOperationException("Choose Cash or Card as the collection method. StackedHub does not take card settlement online.");
        }

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
            if (!menuItem.Available || menuItem.Stock < line.Quantity)
            {
                throw new InvalidOperationException($"{menuItem.Name} is unavailable and cannot be ordered.");
            }

            var subtotal = menuItem.Price * line.Quantity;
            total += subtotal;
            menuItem.Stock -= line.Quantity;
            if (menuItem.Stock <= 0)
            {
                menuItem.Available = false;
            }

            items.Add(new OrderItem
            {
                MenuItemId = menuItem.Id,
                Name = menuItem.Name,
                Quantity = line.Quantity,
                UnitPrice = menuItem.Price,
                Subtotal = subtotal,
                SpecialInstructions = string.IsNullOrWhiteSpace(line.SpecialInstructions) ? null : line.SpecialInstructions.Trim()
            });
        }

        var order = new Order
        {
            CustomerId = customerId,
            Status = OrderStatus.Placed,
            Channel = OrderChannel.Website,
            PaymentMethod = payment,
            Total = total,
            SpecialInstructions = string.IsNullOrWhiteSpace(request.SpecialInstructions) ? null : request.SpecialInstructions.Trim(),
            Items = items
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);
        order.Reference = $"#{4800 + order.Id}";
        await _db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return await LoadOrder(order.Id, cancellationToken) ?? order;
    }

    public Task<Order?> LoadOrder(int id, CancellationToken cancellationToken) =>
        _db.Orders.Include(x => x.Items).Include(x => x.Customer)
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

        return query.OrderByDescending(x => x.PlacedAt).ToListAsync(cancellationToken);
    }

    public async Task<Order> UpdateStatus(int orderId, OrderStatus next, int? staffId, bool customerCancel, int? customerId, CancellationToken cancellationToken)
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
        }
        else if (!OrderLifecycle.CanTransition(order.Status, next))
        {
            throw new InvalidOperationException($"Cannot move {order.Status} to {next}.");
        }

        order.Status = next;
        if (staffId is not null)
        {
            order.StaffId ??= staffId;
        }

        if (next == OrderStatus.Completed)
        {
            var customer = await _db.Users.FirstOrDefaultAsync(x => x.Id == order.CustomerId, cancellationToken);
            if (customer is not null)
            {
                customer.LoyaltyPoints += (int)Math.Floor(order.Total / 10m);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return order;
    }
}
