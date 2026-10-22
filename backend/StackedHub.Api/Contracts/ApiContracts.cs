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

public record AuthUserDto(string Id, string Name, string Email, UserRole Role, int? LoyaltyPoints, bool Active);

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
    string? SpecialInstructions,
    string? AddedByCustomerId = null);

public record PlaceOrderRequest(
    PaymentMethod PaymentMethod,
    string? SpecialInstructions,
    [Required, MinLength(1)] List<CartLineRequest> Items,
    OrderChannel? Channel = null,
    DateTime? ScheduledFor = null,
    string? IdempotencyKey = null);

public record OrderItemDto(
    string MenuItemId,
    string Name,
    int Quantity,
    decimal UnitPrice,
    string? AddedByCustomerId = null,
    string? AddedByName = null,
    string? SpecialInstructions = null);

public record OrderStatusEventDto(OrderStatus Status, DateTime At, string? Note);

public record OrderSlotDto(DateTime Start, DateTime End, int Capacity, int Booked, int Remaining, bool Available);

public record OrderDto(
    string Id,
    string Reference,
    string CustomerId,
    string CustomerName,
    OrderChannel Channel,
    List<OrderItemDto> Items,
    decimal Total,
    OrderStatus Status,
    DateTime PlacedAt,
    PaymentMethod PaymentMethod = PaymentMethod.Cash,
    string? SpecialInstructions = null);

public record UpdateStatusRequest(OrderStatus? Status, OrderStatus? NextStatus);

public record AvailabilityRequest(bool? Available, int? Stock);

public record ActivateUserRequest(bool IsActive = false, bool? Active = null)
{
    public bool Flag => Active ?? IsActive;
}

public record CustomerNoteRequest(string? Note);

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

public record CreateGroupBasketRequest(string? SpecialInstructions, DateTime? ScheduledFor = null);

public record JoinGroupBasketRequest([Required] string JoinCode);

public record UpsertGroupItemRequest(
    [Required] string MenuItemId,
    [Range(1, 20)] int Quantity,
    string? SpecialInstructions);

public record CheckoutGroupBasketRequest(
    PaymentMethod PaymentMethod,
    OrderChannel? Channel = null,
    DateTime? ScheduledFor = null,
    string? SpecialInstructions = null,
    string? IdempotencyKey = null);

public record GroupParticipantDto(string CustomerId, string Name, DateTime JoinedAt, bool IsHost);

public record GroupBasketItemDto(
    string Id,
    string CustomerId,
    string CustomerName,
    string MenuItemId,
    string Name,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal,
    string? SpecialInstructions);

public record GroupBasketDto(
    string Id,
    string JoinCode,
    GroupBasketStatus Status,
    string HostCustomerId,
    string HostName,
    DateTime CreatedAt,
    DateTime? ScheduledFor,
    string? SpecialInstructions,
    decimal Total,
    string? OrderId,
    List<GroupParticipantDto> Participants,
    List<GroupBasketItemDto> Items);

public record LoyaltyRewardDto(string Id, string Title, string Description, int PointsCost, bool Affordable);

public record LoyaltyProgressDto(string Label, int Current, int Target, int Remaining);

public record LoyaltyTransactionDto(string Id, int Points, string Type, string Reason, DateTime At, string? OrderId);

public record LoyaltyWalletDto(
    int Balance,
    string Tier,
    string EarnRule,
    LoyaltyProgressDto? NextTier,
    LoyaltyProgressDto? NextReward,
    List<LoyaltyRewardDto> Rewards,
    List<LoyaltyTransactionDto> Transactions);

public record RedeemLoyaltyRequest([Required] string RewardId);
