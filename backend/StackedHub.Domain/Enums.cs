using System.Text.Json.Serialization;

namespace StackedHub.Domain;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserRole
{
    Customer = 1,
    Staff = 2,
    Admin = 3
}

public enum OrderStatus
{
    Placed = 1,
    InKitchen = 2,
    Ready = 3,
    Completed = 4,
    Cancelled = 5
}

public enum OrderChannel
{
    InStore = 1,
    Website = 2,
    MobileApp = 3,
    UberEats = 4,
    MrD = 5,
    WhatsApp = 6
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentMethod
{
    Cash = 1,
    Card = 2
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MenuCategory
{
    Mains = 1,
    Sides = 2,
    Drinks = 3,
    Desserts = 4
}
