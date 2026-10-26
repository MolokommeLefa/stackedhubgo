namespace StackedHub.Domain;

public class IdempotencyRecord
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;
    public Order Order { get; set; } = null!;
}
