using Microsoft.EntityFrameworkCore;
using StackedHub.Domain;

namespace StackedHub.Infrastructure;

public static class DbSeeder
{
    public const string DemoPassword = "Stacked123!";

    public static void Seed(AppDbContext db)
    {
        if (db.Users.Any())
        {
            return;
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(DemoPassword);
        db.Users.AddRange(
            new User
            {
                Email = "priya.nair@example.co.za",
                PasswordHash = hash,
                FirstName = "Priya",
                LastName = "Nair",
                PhoneNumber = "+27 82 114 7723",
                Role = UserRole.Customer,
                LoyaltyPoints = 412,
                Note = "Prefers extra chilli, collects on Fridays.",
                CreatedAt = new DateTime(2025, 2, 11, 8, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Email = "marcus.bell@example.co.za",
                PasswordHash = hash,
                FirstName = "Marcus",
                LastName = "Bell",
                PhoneNumber = "+27 71 908 3321",
                Role = UserRole.Customer,
                LoyaltyPoints = 15,
                Note = "Allergic to nuts.",
                CreatedAt = new DateTime(2026, 8, 30, 8, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Email = "elena.costa@example.co.za",
                PasswordHash = hash,
                FirstName = "Elena",
                LastName = "Costa",
                PhoneNumber = "+27 83 552 9012",
                Role = UserRole.Customer,
                LoyaltyPoints = 789,
                Note = "Birthday on 26 September.",
                CreatedAt = new DateTime(2024, 11, 5, 8, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Email = "sipho.dlamini@example.co.za",
                PasswordHash = hash,
                FirstName = "Sipho",
                LastName = "Dlamini",
                PhoneNumber = "+27 74 220 1188",
                Role = UserRole.Customer,
                LoyaltyPoints = 198,
                Note = "Orders for the office every Wednesday.",
                CreatedAt = new DateTime(2025, 6, 18, 8, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Email = "aisha.patel@example.co.za",
                PasswordHash = hash,
                FirstName = "Aisha",
                LastName = "Patel",
                PhoneNumber = "+27 76 445 7710",
                Role = UserRole.Customer,
                LoyaltyPoints = 129,
                Note = "Vegetarian options only.",
                CreatedAt = new DateTime(2025, 9, 2, 8, 0, 0, DateTimeKind.Utc)
            },
            new User
            {
                Email = "jason@stackedfoods.co.za",
                PasswordHash = hash,
                FirstName = "Jason",
                LastName = "Reid",
                PhoneNumber = "0820001002",
                Role = UserRole.Staff
            },
            new User
            {
                Email = "nomsa@stackedfoods.co.za",
                PasswordHash = hash,
                FirstName = "Nomsa",
                LastName = "Khumalo",
                PhoneNumber = "0820001004",
                Role = UserRole.Staff
            },
            new User
            {
                Email = "thandi@stackedfoods.co.za",
                PasswordHash = hash,
                FirstName = "Thandi",
                LastName = "Mokoena",
                PhoneNumber = "0820001003",
                Role = UserRole.Admin
            }
        );

        db.MenuItems.AddRange(
            Item("Peri-Peri Chicken Stack", "Flame-grilled chicken, chilli mayo, toasted brioche.", MenuCategory.Mains, 129, 42, 10, true, true),
            Item("Double Smash Burger", "Two beef patties, cheddar, house sauce, pickles.", MenuCategory.Mains, 145, 28, 10, false, true),
            Item("Bunny Chow", "Quarter loaf, slow-cooked lamb curry, carrot sambal.", MenuCategory.Mains, 119, 16, 10, true, true),
            Item("Boerewors Roll", "Grilled boerewors, chakalaka relish, soft roll.", MenuCategory.Mains, 89, 7, 10, false, true),
            Item("Chakalaka Fries", "Crispy fries loaded with spicy chakalaka and cheese.", MenuCategory.Sides, 55, 4, 10, true, true),
            Item("Onion Rings", "Beer-battered rings with garlic aioli.", MenuCategory.Sides, 45, 33, 10, false, true),
            Item("Homemade Lemonade", "Fresh lemon, mint, lightly sparkling.", MenuCategory.Drinks, 32, 60, 12, false, true),
            Item("Iced Rooibos", "Chilled rooibos with honey and citrus.", MenuCategory.Drinks, 28, 48, 12, false, true),
            Item("Malva Pudding", "Warm malva sponge with custard.", MenuCategory.Desserts, 49, 12, 8, false, true),
            Item("Koeksister Bites", "Syrup-soaked twists, three per serving.", MenuCategory.Desserts, 38, 0, 8, false, false)
        );

        db.Promotions.AddRange(
            new Promotion { Title = "Two-for-Tuesday Stacks", Description = "Buy any two mains and get 20% off the bill.", DiscountPercent = 20, StartsAt = new DateTime(2026, 9, 1), EndsAt = new DateTime(2026, 10, 31), Active = true, Redemptions = 214 },
            new Promotion { Title = "Loyalty Double Points", Description = "Members earn double points on app orders over R150.", DiscountPercent = 0, StartsAt = new DateTime(2026, 9, 15), EndsAt = new DateTime(2026, 9, 30), Active = true, Redemptions = 96 },
            new Promotion { Title = "Winter Bunny Bundle", Description = "Bunny chow and a hot drink for a fixed price.", DiscountPercent = 15, StartsAt = new DateTime(2026, 6, 1), EndsAt = new DateTime(2026, 8, 31), Active = false, Redemptions = 388 }
        );

        db.SaveChanges();

        var priya = db.Users.Single(x => x.Email == "priya.nair@example.co.za");
        var marcus = db.Users.Single(x => x.Email == "marcus.bell@example.co.za");
        var elena = db.Users.Single(x => x.Email == "elena.costa@example.co.za");
        var sipho = db.Users.Single(x => x.Email == "sipho.dlamini@example.co.za");
        var aisha = db.Users.Single(x => x.Email == "aisha.patel@example.co.za");
        var jason = db.Users.Single(x => x.Email == "jason@stackedfoods.co.za");
        var nomsa = db.Users.Single(x => x.Email == "nomsa@stackedfoods.co.za");
        var thandi = db.Users.Single(x => x.Email == "thandi@stackedfoods.co.za");

        var peri = db.MenuItems.Single(x => x.Name == "Peri-Peri Chicken Stack");
        var smash = db.MenuItems.Single(x => x.Name == "Double Smash Burger");
        var bunny = db.MenuItems.Single(x => x.Name == "Bunny Chow");
        var wors = db.MenuItems.Single(x => x.Name == "Boerewors Roll");
        var fries = db.MenuItems.Single(x => x.Name == "Chakalaka Fries");
        var rings = db.MenuItems.Single(x => x.Name == "Onion Rings");
        var lemonade = db.MenuItems.Single(x => x.Name == "Homemade Lemonade");
        var rooibos = db.MenuItems.Single(x => x.Name == "Iced Rooibos");
        var malva = db.MenuItems.Single(x => x.Name == "Malva Pudding");

        db.Orders.AddRange(
            OrderOf("#4821", priya, OrderChannel.Website, OrderStatus.InKitchen, new DateTime(2026, 9, 23, 11, 42, 0, DateTimeKind.Utc), jason.Id,
                Line(peri, 2), Line(fries, 1)),
            OrderOf("#4820", marcus, OrderChannel.MobileApp, OrderStatus.Ready, new DateTime(2026, 9, 23, 11, 28, 0, DateTimeKind.Utc), jason.Id,
                Line(smash, 1), Line(lemonade, 1)),
            OrderOf("#4819", elena, OrderChannel.WhatsApp, OrderStatus.Placed, new DateTime(2026, 9, 23, 11, 15, 0, DateTimeKind.Utc), null,
                Line(bunny, 1), Line(malva, 2)),
            OrderOf("#4818", sipho, OrderChannel.UberEats, OrderStatus.Completed, new DateTime(2026, 9, 23, 10, 51, 0, DateTimeKind.Utc), jason.Id,
                Line(wors, 4), Line(rings, 2)),
            OrderOf("#4817", aisha, OrderChannel.MrD, OrderStatus.Completed, new DateTime(2026, 9, 23, 10, 20, 0, DateTimeKind.Utc), jason.Id,
                Line(fries, 2), Line(rooibos, 2)),
            OrderOf("#4816", priya, OrderChannel.InStore, OrderStatus.Cancelled, new DateTime(2026, 9, 23, 9, 48, 0, DateTimeKind.Utc), null,
                Line(smash, 1))
        );

        db.AuditLogs.AddRange(
            Log(thandi.Id, "Updated promotion", "Promotion", "Two-for-Tuesday Stacks", new DateTime(2026, 9, 23, 11, 5, 0, DateTimeKind.Utc)),
            Log(jason.Id, "Changed order status to Ready", "Order", "#4820", new DateTime(2026, 9, 23, 11, 31, 0, DateTimeKind.Utc)),
            Log(thandi.Id, "Adjusted stock level", "MenuItem", "Chakalaka Fries", new DateTime(2026, 9, 23, 10, 44, 0, DateTimeKind.Utc)),
            Log(nomsa.Id, "Created menu item", "MenuItem", "Koeksister Bites", new DateTime(2026, 9, 22, 16, 12, 0, DateTimeKind.Utc)),
            Log(thandi.Id, "Deactivated staff account", "User", "temp.cashier@stackedfoods.co.za", new DateTime(2026, 9, 22, 9, 2, 0, DateTimeKind.Utc))
        );

        db.SaveChanges();
    }

    private static MenuItem Item(string name, string description, MenuCategory category, decimal price, int stock, int threshold, bool spicy, bool available) =>
        new()
        {
            Name = name,
            Description = description,
            Category = category,
            Price = price,
            Stock = stock,
            LowStockThreshold = threshold,
            Spicy = spicy,
            Available = available
        };

    private static OrderItem Line(MenuItem item, int quantity) =>
        new()
        {
            MenuItemId = item.Id,
            Name = item.Name,
            Quantity = quantity,
            UnitPrice = item.Price,
            Subtotal = item.Price * quantity
        };

    private static Order OrderOf(string reference, User customer, OrderChannel channel, OrderStatus status, DateTime placedAt, int? staffId, params OrderItem[] items) =>
        new()
        {
            Reference = reference,
            CustomerId = customer.Id,
            StaffId = staffId,
            Status = status,
            Channel = channel,
            PaymentMethod = PaymentMethod.Cash,
            Total = items.Sum(x => x.Subtotal),
            PlacedAt = placedAt,
            Items = items
        };

    private static AuditLog Log(int actorId, string action, string entity, string target, DateTime at) =>
        new()
        {
            AdminId = actorId,
            Action = action,
            Entity = entity,
            Details = target,
            CreatedAt = at
        };
}
