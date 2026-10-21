namespace StackedHub.Domain;

public class GroupBasketParticipant
{
    public int Id { get; set; }
    public int GroupBasketId { get; set; }
    public int CustomerId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public GroupBasket GroupBasket { get; set; } = null!;
    public User Customer { get; set; } = null!;
}
