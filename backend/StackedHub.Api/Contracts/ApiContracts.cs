using System.ComponentModel.DataAnnotations;
using StackedHub.Domain;

namespace StackedHub.Api.Contracts;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    string? FirstName,
    string? LastName,
    string? Name,
    string? PhoneNumber);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record ForgotPasswordRequest([Required, EmailAddress] string Email);

public record AuthUserDto(string Id, string Name, string Email, UserRole Role, int? LoyaltyPoints);

public record AuthResponse(string Token, AuthUserDto User);

public record MenuItemDto(
    string Id,
    string Name,
    string Description,
    MenuCategory Category,
    decimal Price,
    int Stock,
    int LowStockThreshold,
    bool Spicy,
    bool Available);

public record UpsertMenuRequest(
    [Required] string Name,
    [Required] string Description,
    MenuCategory Category,
    [Range(0, 10000)] decimal Price,
    int Stock = 0,
    int LowStockThreshold = 10,
    bool Spicy = false,
    bool Available = true);

public record CartLineRequest(
    [Required] string MenuItemId,
    [Range(1, 20)] int Quantity,
    string? SpecialInstructions);

public record PlaceOrderRequest(
    PaymentMethod PaymentMethod,
    string? SpecialInstructions,
    [Required, MinLength(1)] List<CartLineRequest> Items);

public record OrderItemDto(string MenuItemId, string Name, int Quantity, decimal UnitPrice);

public record OrderDto(
    string Id,
    string Reference,
    string CustomerId,
    string CustomerName,
    OrderChannel Channel,
    List<OrderItemDto> Items,
    decimal Total,
    OrderStatus Status,
    DateTime PlacedAt);

public record UpdateStatusRequest(OrderStatus? Status, OrderStatus? NextStatus);

public record AvailabilityRequest(bool Available, int? Stock);

public record ActivateUserRequest(bool IsActive);

public record AssistantRequest([Required, MaxLength(400)] string Message);

public record AssistantAction(string Type, string MenuItemId, string Name);

public record AssistantResponse(string Reply, string Topic, string Source, List<AssistantAction> Actions);

public record AiRecommendationRequest(string? Prompt, List<string>? MenuItemIds);

public record AiSuggestion(string Name, string Reason, string? MenuItemId = null);

public record CustomerDto(
    string Id,
    string Name,
    string Email,
    string Phone,
    DateTime JoinedAt,
    int Orders,
    decimal Spend,
    int LoyaltyPoints,
    string Tier,
    string Note);

public record UpsertPromotionRequest(
    [Required] string Title,
    [Required] string Description,
    [Range(0, 100)] int DiscountPercent,
    DateTime StartsAt,
    DateTime EndsAt,
    bool Active = true);

public record PromotionDto(
    string Id,
    string Title,
    string Description,
    int DiscountPercent,
    DateTime StartsAt,
    DateTime EndsAt,
    bool Active,
    int Redemptions);

public record HourPoint(string Hour, int Orders);

public record DayRevenue(string Day, decimal Revenue);

public record BestSeller(string Name, int Sold);

public record ChannelSales(string Channel, decimal Total);

public record ReportDto(
    int OrderCount,
    decimal CompletedSales,
    List<HourPoint> HourlyOrders,
    List<DayRevenue> RevenueByDay,
    List<BestSeller> BestSellers,
    List<ChannelSales> SalesByChannel);

public record AuditLogDto(string Id, string Actor, UserRole Role, string Action, string Target, DateTime At);
