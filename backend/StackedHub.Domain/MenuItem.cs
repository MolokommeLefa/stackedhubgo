namespace StackedHub.Domain;

public class MenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public MenuCategory Category { get; set; } = MenuCategory.Mains;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int LowStockThreshold { get; set; } = 10;
    public bool Spicy { get; set; }
    public bool Available { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
