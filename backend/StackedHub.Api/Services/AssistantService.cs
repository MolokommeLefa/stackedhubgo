using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

public class AssistantService
{
    private readonly AppDbContext _db;

    private static readonly (string Topic, string[] Keywords, string Answer)[] Faqs =
    [
        ("hours", ["hour", "open", "close", "time", "when"],
            "StackedHub treats the kitchen as open 11:00–21:00 for pickup in this prototype. Confirm live hours with the store."),
        ("pickup", ["pickup", "collect", "collection", "fetch"],
            "The Must-have release is pickup only. Place the order, watch the status, then collect when it is Ready."),
        ("delivery", ["deliver", "delivery", "uber", "address", "mr d"],
            "Owned delivery is not in this prototype. Choose pickup. Uber Eats and Mr D stay as order channels, not live integrations."),
        ("payment", ["pay", "payment", "card", "cash", "eft"],
            "Checkout records Cash or Card as the method you will use at collection. There is no live card gateway in this MVP."),
        ("order", ["how to order", "place order", "checkout", "cart"],
            "Add available items, checkout as pickup, choose Cash or Card, then track the order reference."),
        ("tracking", ["track", "status", "ready", "kitchen"],
            "Staff move orders through Placed → In kitchen → Ready → Completed. Cancelled is a terminal state."),
        ("cancel", ["cancel", "refund"],
            "Customers can cancel while the order is still Placed. After it is In kitchen, only staff can stop it."),
        ("loyalty", ["loyalty", "points", "vip"],
            "Completed pickup orders earn loyalty points (R10 = 1 point). VIP starts around 400 points.")
    ];

    public AssistantService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AssistantResponse> AnswerAsync(string message, int? customerId, CancellationToken cancellationToken)
    {
        var text = message.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return new AssistantResponse(
                "Ask me about the menu, pickup, payment, or tracking. I only answer from StackedHub facts.",
                "empty",
                "policy",
                []);
        }

        var haystack = Normalize(text);
        var menu = await _db.MenuItems.AsNoTracking().ToListAsync(cancellationToken);
        var mentioned = menu.Where(item =>
        {
            var name = Normalize(item.Name);
            var first = name.Split(' ')[0];
            return haystack.Contains(name) || (first.Length > 3 && haystack.Contains(first));
        }).ToList();

        if (mentioned.Count > 0 && ContainsAny(haystack, "price", "cost", "how much", "available", "sold", "what is", "tell me"))
        {
            var reply = string.Join(" ", mentioned.Select(item =>
                item.Available && item.Stock > 0
                    ? $"{item.Name} is available at R{item.Price:0}. {item.Description}"
                    : $"{item.Name} is listed at R{item.Price:0} but is marked unavailable, so it cannot be ordered."));
            var actions = mentioned.Where(x => x.Available && x.Stock > 0)
                .Select(x => new AssistantAction("add_to_cart", x.Id.ToString(), x.Name))
                .ToList();
            return new AssistantResponse(reply, "item", "menu", actions);
        }

        if (ContainsAny(haystack, "menu", "burger", "fries", "recommend", "suggest", "what is good", "combo", "available", "spicy", "peri"))
        {
            var available = menu.Where(x => x.Available && x.Stock > 0).ToList();
            var overview = string.Join(". ", available.GroupBy(x => x.Category)
                .Select(g => $"{g.Key}: {string.Join(", ", g.Select(i => $"{i.Name} (R{i.Price:0})"))}"));
            var smash = available.FirstOrDefault(x => x.Name.Contains("Smash", StringComparison.OrdinalIgnoreCase));
            var fries = available.FirstOrDefault(x => x.Name.Contains("Chakalaka", StringComparison.OrdinalIgnoreCase));
            var actions = new[] { smash, fries }.Where(x => x is not null)
                .Select(x => new AssistantAction("add_to_cart", x!.Id.ToString(), x.Name))
                .ToList();
            var rec = smash is null
                ? overview
                : $"A solid pickup combo starts with {smash.Name}. {overview}";
            return new AssistantResponse(rec, "menu", "menu", actions);
        }

        if (customerId is not null && ContainsAny(haystack, "order", "track", "status", "ready"))
        {
            var latest = await _db.Orders.AsNoTracking()
                .Where(x => x.CustomerId == customerId)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (latest is not null)
            {
                return new AssistantResponse(
                    $"Your latest order {latest.Reference} is {FormatStatus(latest.Status)}. Total R{latest.Total:0}.",
                    "tracking",
                    "order",
                    []);
            }
        }

        var faq = Faqs
            .Select(item => (item.Topic, item.Answer, Score: item.Keywords.Count(k => haystack.Contains(k))))
            .OrderByDescending(x => x.Score)
            .First();
        if (faq.Score > 0)
        {
            return new AssistantResponse(faq.Answer, faq.Topic, "faq", []);
        }

        return new AssistantResponse(
            "I can help with StackedHub facts: menu and prices, availability, pickup, Cash/Card at collection, and tracking. Try “What’s available?”",
            "fallback",
            "policy",
            []);
    }

    private static string FormatStatus(OrderStatus status) =>
        status == OrderStatus.InKitchen ? "In kitchen" : status.ToString();

    private static string Normalize(string value) =>
        new string(value.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : ' ').ToArray())
            .Replace("  ", " ", StringComparison.Ordinal)
            .Trim();

    private static bool ContainsAny(string haystack, params string[] needles) =>
        needles.Any(haystack.Contains);
}
