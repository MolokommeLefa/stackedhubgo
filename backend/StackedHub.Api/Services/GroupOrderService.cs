using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

public class GroupOrderService
{
    private const int MaxParticipants = 8;
    private const string JoinAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private readonly AppDbContext _db;
    private readonly OrderService _orders;

    public GroupOrderService(AppDbContext db, OrderService orders)
    {
        _db = db;
        _orders = orders;
    }

    public async Task<GroupBasket> Create(int hostCustomerId, CreateGroupBasketRequest request, CancellationToken cancellationToken)
    {
        await EnsureCustomer(hostCustomerId, cancellationToken);
        var basket = new GroupBasket
        {
            HostCustomerId = hostCustomerId,
            JoinCode = await UniqueJoinCode(cancellationToken),
            SpecialInstructions = TrimOrNull(request.SpecialInstructions),
            ScheduledFor = request.ScheduledFor,
            Participants =
            {
                new GroupBasketParticipant { CustomerId = hostCustomerId }
            }
        };
        _db.GroupBaskets.Add(basket);
        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public Task<List<GroupBasket>> ForCustomer(int customerId, CancellationToken cancellationToken) =>
        Query()
            .Where(x => x.Participants.Any(p => p.CustomerId == customerId)
                && x.Status != GroupBasketStatus.Cancelled
                && x.Status != GroupBasketStatus.Converted)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);

    public async Task<GroupBasket> GetForParticipant(int basketId, int customerId, CancellationToken cancellationToken)
    {
        var basket = await Load(basketId, cancellationToken) ?? throw new KeyNotFoundException("Group order not found.");
        EnsureParticipant(basket, customerId);
        return basket;
    }

    public async Task<GroupBasket> Join(int customerId, string joinCode, CancellationToken cancellationToken)
    {
        await EnsureCustomer(customerId, cancellationToken);
        var code = joinCode.Trim().ToUpperInvariant();
        var basket = await Query().FirstOrDefaultAsync(x => x.JoinCode == code, cancellationToken)
            ?? throw new KeyNotFoundException("That group order code is not valid.");
        if (basket.Status is GroupBasketStatus.Converted or GroupBasketStatus.Cancelled)
        {
            throw new InvalidOperationException("This group order is no longer open.");
        }

        if (basket.Participants.Any(x => x.CustomerId == customerId))
        {
            return basket;
        }

        if (basket.Status != GroupBasketStatus.Open)
        {
            throw new InvalidOperationException("This group order is locked for checkout.");
        }

        if (basket.Participants.Count >= MaxParticipants)
        {
            throw new InvalidOperationException($"Group orders are limited to {MaxParticipants} people.");
        }

        basket.Participants.Add(new GroupBasketParticipant { CustomerId = customerId });
        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public async Task<GroupBasket> AddItem(int basketId, int customerId, UpsertGroupItemRequest request, CancellationToken cancellationToken)
    {
        var basket = await RequireOpen(basketId, customerId, cancellationToken);
        if (!int.TryParse(request.MenuItemId, out var menuItemId))
        {
            throw new InvalidOperationException("Menu item id is invalid.");
        }

        var menuItem = await _db.MenuItems.FirstOrDefaultAsync(x => x.Id == menuItemId, cancellationToken)
            ?? throw new InvalidOperationException("A menu item in the cart no longer exists.");
        if (!menuItem.Available)
        {
            throw new InvalidOperationException($"{menuItem.Name} is unavailable and cannot be ordered.");
        }

        basket.Items.Add(new GroupBasketItem
        {
            CustomerId = customerId,
            MenuItemId = menuItem.Id,
            Name = menuItem.Name,
            Quantity = request.Quantity,
            UnitPrice = menuItem.Price,
            SpecialInstructions = TrimOrNull(request.SpecialInstructions)
        });
        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public async Task<GroupBasket> UpdateItem(int basketId, int itemId, int customerId, UpsertGroupItemRequest request, CancellationToken cancellationToken)
    {
        var basket = await RequireOpen(basketId, customerId, cancellationToken);
        var item = basket.Items.FirstOrDefault(x => x.Id == itemId)
            ?? throw new KeyNotFoundException("That item is not in this group order.");
        if (item.CustomerId != customerId && basket.HostCustomerId != customerId)
        {
            throw new UnauthorizedAccessException("You can only edit your own items.");
        }

        item.Quantity = request.Quantity;
        item.SpecialInstructions = TrimOrNull(request.SpecialInstructions);
        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public async Task<GroupBasket> RemoveItem(int basketId, int itemId, int customerId, CancellationToken cancellationToken)
    {
        var basket = await RequireOpen(basketId, customerId, cancellationToken);
        var item = basket.Items.FirstOrDefault(x => x.Id == itemId)
            ?? throw new KeyNotFoundException("That item is not in this group order.");
        if (item.CustomerId != customerId && basket.HostCustomerId != customerId)
        {
            throw new UnauthorizedAccessException("You can only remove your own items.");
        }

        _db.GroupBasketItems.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public async Task<GroupBasket> Lock(int basketId, int customerId, bool locked, CancellationToken cancellationToken)
    {
        var basket = await Load(basketId, cancellationToken) ?? throw new KeyNotFoundException("Group order not found.");
        EnsureHost(basket, customerId);
        if (basket.Status is GroupBasketStatus.Converted or GroupBasketStatus.Cancelled)
        {
            throw new InvalidOperationException("This group order can no longer be changed.");
        }

        if (locked)
        {
            if (basket.Items.Count == 0)
            {
                throw new InvalidOperationException("Add at least one item before locking the group order.");
            }

            basket.Status = GroupBasketStatus.Locked;
            basket.LockedAt = DateTime.UtcNow;
        }
        else if (basket.Status == GroupBasketStatus.Locked)
        {
            basket.Status = GroupBasketStatus.Open;
            basket.LockedAt = null;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public async Task<GroupBasket> Cancel(int basketId, int customerId, CancellationToken cancellationToken)
    {
        var basket = await Load(basketId, cancellationToken) ?? throw new KeyNotFoundException("Group order not found.");
        EnsureHost(basket, customerId);
        if (basket.Status == GroupBasketStatus.Converted)
        {
            throw new InvalidOperationException("This group order has already been checked out.");
        }

        basket.Status = GroupBasketStatus.Cancelled;
        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public async Task<GroupBasket> Leave(int basketId, int customerId, CancellationToken cancellationToken)
    {
        var basket = await RequireOpen(basketId, customerId, cancellationToken);
        if (basket.HostCustomerId == customerId)
        {
            throw new InvalidOperationException("The host cannot leave. Cancel the group order instead.");
        }

        var participant = basket.Participants.First(x => x.CustomerId == customerId);
        _db.GroupBasketParticipants.Remove(participant);
        foreach (var item in basket.Items.Where(x => x.CustomerId == customerId).ToList())
        {
            _db.GroupBasketItems.Remove(item);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return await Load(basket.Id, cancellationToken) ?? basket;
    }

    public async Task<(GroupBasket Basket, Order Order)> Checkout(
        int basketId,
        int hostCustomerId,
        CheckoutGroupBasketRequest request,
        string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        var basket = await Load(basketId, cancellationToken) ?? throw new KeyNotFoundException("Group order not found.");
        EnsureHost(basket, hostCustomerId);
        if (basket.Status == GroupBasketStatus.Converted && basket.OrderId is not null)
        {
            var existing = await _orders.LoadOrder(basket.OrderId.Value, cancellationToken)
                ?? throw new InvalidOperationException("The group order was converted but the pickup order is missing.");
            return (basket, existing);
        }

        if (basket.Status == GroupBasketStatus.Cancelled)
        {
            throw new InvalidOperationException("This group order was cancelled.");
        }

        if (basket.Items.Count == 0)
        {
            throw new InvalidOperationException("Add at least one item before checkout.");
        }

        if (basket.Status == GroupBasketStatus.Open)
        {
            basket.Status = GroupBasketStatus.Locked;
            basket.LockedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        var lines = basket.Items.Select(item => new CartLineRequest(
            item.MenuItemId.ToString(),
            item.Quantity,
            item.SpecialInstructions,
            item.CustomerId.ToString())).ToList();

        var place = new PlaceOrderRequest(
            request.PaymentMethod,
            TrimOrNull(request.SpecialInstructions) ?? basket.SpecialInstructions,
            lines,
            request.Channel,
            request.ScheduledFor ?? basket.ScheduledFor,
            string.IsNullOrWhiteSpace(idempotencyKey) ? $"group:{basket.Id}" : idempotencyKey.Trim());

        var order = await _orders.PlacePickupAsync(hostCustomerId, place, cancellationToken);
        basket.Status = GroupBasketStatus.Converted;
        basket.OrderId = order.Id;
        await _db.SaveChangesAsync(cancellationToken);
        return (await Load(basket.Id, cancellationToken) ?? basket, order);
    }

    private async Task<GroupBasket> RequireOpen(int basketId, int customerId, CancellationToken cancellationToken)
    {
        var basket = await Load(basketId, cancellationToken) ?? throw new KeyNotFoundException("Group order not found.");
        EnsureParticipant(basket, customerId);
        if (basket.Status != GroupBasketStatus.Open)
        {
            throw new InvalidOperationException("This group order is locked for checkout.");
        }

        return basket;
    }

    private IQueryable<GroupBasket> Query() =>
        _db.GroupBaskets
            .Include(x => x.Host)
            .Include(x => x.Participants).ThenInclude(x => x.Customer)
            .Include(x => x.Items).ThenInclude(x => x.Customer);

    private Task<GroupBasket?> Load(int id, CancellationToken cancellationToken) =>
        Query().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    private async Task EnsureCustomer(int customerId, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == customerId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Account not found.");
        if (user.Role != UserRole.Customer || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Only registered customers can join a group order.");
        }
    }

    private static void EnsureParticipant(GroupBasket basket, int customerId)
    {
        if (basket.Participants.All(x => x.CustomerId != customerId))
        {
            throw new UnauthorizedAccessException("You are not part of this group order.");
        }
    }

    private static void EnsureHost(GroupBasket basket, int customerId)
    {
        if (basket.HostCustomerId != customerId)
        {
            throw new UnauthorizedAccessException("Only the host can do that.");
        }
    }

    private async Task<string> UniqueJoinCode(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var code = RandomCode();
            if (!await _db.GroupBaskets.AnyAsync(x => x.JoinCode == code, cancellationToken))
            {
                return code;
            }
        }

        throw new InvalidOperationException("Could not allocate a group order code. Try again.");
    }

    private static string RandomCode()
    {
        Span<char> chars = stackalloc char[6];
        for (var i = 0; i < chars.Length; i++)
        {
            chars[i] = JoinAlphabet[RandomNumberGenerator.GetInt32(JoinAlphabet.Length)];
        }

        return new string(chars);
    }

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
