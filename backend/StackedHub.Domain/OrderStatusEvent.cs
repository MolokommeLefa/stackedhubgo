namespace StackedHub.Domain;

public class OrderStatusEvent
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
    public int? ActorId { get; set; }
    public string? Note { get; set; }

    public Order Order { get; set; } = null!;
    public User? Actor { get; set; }
}
