namespace StackedHub.Domain;

public class GroupBasket
{
    public int Id { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public int HostCustomerId { get; set; }
    public GroupBasketStatus Status { get; set; } = GroupBasketStatus.Open;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LockedAt { get; set; }
    public int? OrderId { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public string? SpecialInstructions { get; set; }

    public User Host { get; set; } = null!;
    public Order? Order { get; set; }
    public ICollection<GroupBasketParticipant> Participants { get; set; } = new List<GroupBasketParticipant>();
    public ICollection<GroupBasketItem> Items { get; set; } = new List<GroupBasketItem>();
}
