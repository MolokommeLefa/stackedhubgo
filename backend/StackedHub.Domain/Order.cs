namespace StackedHub.Domain;

public class Order
{
    public int Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int? StaffId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Placed;
    public OrderChannel Channel { get; set; } = OrderChannel.Website;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public decimal Total { get; set; }
    public string? SpecialInstructions { get; set; }
    public DateTime PlacedAt { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;
    public User? Staff { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
