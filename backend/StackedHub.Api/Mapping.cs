using StackedHub.Api.Contracts;
using StackedHub.Domain;

namespace StackedHub.Api;

public static class Mapping
{
    public static AuthUserDto ToAuth(this User user) =>
        new(user.Id.ToString(), user.Name, user.Email, user.Role, user.Role == UserRole.Customer ? user.LoyaltyPoints : null);

    public static MenuItemDto ToDto(this MenuItem item) =>
        new(item.Id.ToString(), item.Name, item.Description, item.Category, item.Price, item.Stock, item.LowStockThreshold, item.Spicy, item.Available);

    public static OrderDto ToDto(this Order order) =>
        new(
            order.Id.ToString(),
            string.IsNullOrWhiteSpace(order.Reference) ? $"#{order.Id}" : order.Reference,
            order.CustomerId.ToString(),
            order.Customer?.Name ?? string.Empty,
            order.Channel,
            order.Items.Select(item => new OrderItemDto(item.MenuItemId.ToString(), item.Name, item.Quantity, item.UnitPrice)).ToList(),
            order.Total,
            order.Status,
            order.PlacedAt);

    public static PromotionDto ToDto(this Promotion promotion) =>
        new(promotion.Id.ToString(), promotion.Title, promotion.Description, promotion.DiscountPercent, promotion.StartsAt, promotion.EndsAt, promotion.Active, promotion.Redemptions);

    public static AuditLogDto ToDto(this AuditLog log) =>
        new(
            log.Id.ToString(),
            log.Admin?.Name ?? "System",
            log.Admin?.Role ?? UserRole.Admin,
            log.Action,
            string.IsNullOrWhiteSpace(log.Details) ? $"{log.Entity} #{log.EntityId}" : log.Details!,
            log.CreatedAt);

    public static CustomerDto ToCustomer(this User user, IReadOnlyCollection<Order> orders)
    {
        var billed = orders.Where(x => x.CustomerId == user.Id && x.Status != OrderStatus.Cancelled).ToList();
        var count = billed.Count;
        var spend = billed.Sum(x => x.Total);
        var tier = user.LoyaltyPoints >= 400 ? "VIP" : user.LoyaltyPoints >= 100 ? "Regular" : "New";
        return new CustomerDto(
            user.Id.ToString(),
            user.Name,
            user.Email,
            user.PhoneNumber,
            user.CreatedAt,
            count,
            spend,
            user.LoyaltyPoints,
            tier,
            user.Note);
    }

    public static (string First, string Last) SplitName(string? firstName, string? lastName, string? fullName, string email)
    {
        if (!string.IsNullOrWhiteSpace(firstName))
        {
            return (firstName.Trim(), lastName?.Trim() ?? string.Empty);
        }

        if (!string.IsNullOrWhiteSpace(fullName))
        {
            var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            return (parts[0], parts.Length > 1 ? parts[1] : string.Empty);
        }

        var local = email.Split('@')[0].Replace('.', ' ').Replace('_', ' ');
        var fromEmail = local.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var first = fromEmail.Length > 0 ? char.ToUpper(fromEmail[0][0]) + fromEmail[0][1..] : "Customer";
        var last = fromEmail.Length > 1 ? fromEmail[1] : string.Empty;
        return (first, last);
    }
}
