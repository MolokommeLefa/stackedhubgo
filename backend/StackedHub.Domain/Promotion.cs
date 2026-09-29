namespace StackedHub.Domain;

public class Promotion
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DiscountPercent { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool Active { get; set; } = true;
    public int Redemptions { get; set; }
}
