namespace StackedHub.Domain;

public class GroupBasketItem
{
    public int Id { get; set; }
    public int GroupBasketId { get; set; }
    public int CustomerId { get; set; }
    public int MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? SpecialInstructions { get; set; }

    public decimal Subtotal => UnitPrice * Quantity;

    public GroupBasket GroupBasket { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public MenuItem MenuItem { get; set; } = null!;
}
