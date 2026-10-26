namespace StackedHub.Domain;

public class LoyaltyTransaction
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int? OrderId { get; set; }
    public int Points { get; set; }
    public string Type { get; set; } = "Earn";
    public string Reason { get; set; } = string.Empty;
    public DateTime At { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;
    public Order? Order { get; set; }
}
