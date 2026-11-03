using Microsoft.EntityFrameworkCore;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

/// <summary>
/// Writes the admin activity feed. Order placement, delivery, status changes,
/// loyalty, and scheduled release all land here so the audit page stays current.
/// </summary>
public static class AuditTrail
{
    public static void Add(
        AppDbContext db,
        int actorId,
        string action,
        string entity,
        int? entityId,
        string? details,
        DateTime? at = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            AdminId = actorId,
            Action = Trim(action, 80),
            Entity = Trim(entity, 80),
            EntityId = entityId,
            Details = string.IsNullOrWhiteSpace(details) ? null : details.Trim(),
            CreatedAt = at ?? DateTime.UtcNow
        });
    }

    public static string StatusLabel(OrderStatus status) =>
        status == OrderStatus.InKitchen ? "In kitchen" : status.ToString();

    public static string? DeliveryAddress(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            return null;
        }

        const string marker = "Deliver to:";
        var index = notes.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (index < 0)
        {
            return null;
        }

        var rest = notes[(index + marker.Length)..].Trim();
        var cut = rest.IndexOf('—');
        if (cut >= 0)
        {
            rest = rest[..cut];
        }

        rest = rest.Trim().TrimEnd('.', ',');
        return rest.Length == 0 ? null : rest;
    }

    public static string PlacementAction(Order order, string? idempotencyKey)
    {
        var group = idempotencyKey?.StartsWith("group:", StringComparison.OrdinalIgnoreCase) == true
            || order.Items.Any(x => x.AddedByCustomerId is not null);
        if (group)
        {
            return "Checked out group order";
        }

        if (DeliveryAddress(order.SpecialInstructions) is not null)
        {
            return "Placed delivery order";
        }

        if (order.ScheduledFor is not null || order.Status == OrderStatus.Scheduled)
        {
            return "Scheduled collection order";
        }

        return "Placed order";
    }

    public static string TransitionAction(
        OrderStatus previous,
        OrderStatus next,
        bool customerCancel,
        string? note,
        string? specialInstructions)
    {
        if (customerCancel)
        {
            return "Cancelled order";
        }

        if (previous == OrderStatus.Scheduled && next == OrderStatus.Placed)
        {
            return "Released scheduled order";
        }

        if (next == OrderStatus.Cancelled
            && note is not null
            && note.Contains("stock", StringComparison.OrdinalIgnoreCase))
        {
            return "Cancelled scheduled order";
        }

        var delivery = DeliveryAddress(specialInstructions) is not null;
        if (delivery && next == OrderStatus.Completed)
        {
            return "Completed delivery order";
        }

        if (delivery && next == OrderStatus.Ready)
        {
            return "Marked delivery ready";
        }

        if (delivery && next == OrderStatus.Cancelled)
        {
            return "Cancelled delivery order";
        }

        if (next == OrderStatus.Cancelled)
        {
            return "Cancelled order";
        }

        return $"Changed order status to {StatusLabel(next)}";
    }

    public static string DescribeOrder(Order order, string? customerName = null)
    {
        var who = string.IsNullOrWhiteSpace(customerName) ? order.Customer?.Name : customerName.Trim();
        var address = DeliveryAddress(order.SpecialInstructions);
        var where = address is not null
            ? $"Deliver to {address}"
            : order.ScheduledFor is not null || order.Status == OrderStatus.Scheduled
                ? "Scheduled collection"
                : "Collection";
        var items = string.Join(", ", order.Items.Select(x => $"{x.Quantity}× {x.Name}"));
        var head = string.IsNullOrWhiteSpace(who) ? order.Reference : $"{order.Reference} · {who}";
        return string.IsNullOrWhiteSpace(items) ? $"{head} · {where}" : $"{head} · {where} · {items}";
    }

    /// <summary>
    /// Older orders were saved before placement and status changes wrote audit rows.
    /// Fill those in once so the admin feed includes work already done.
    /// </summary>
    public static void BackfillOrders(AppDbContext db)
    {
        var logs = db.AuditLogs.AsNoTracking()
            .Select(x => new { x.Action, x.EntityId, x.Details })
            .ToList();
        var orders = db.Orders.AsNoTracking()
            .Include(x => x.Items)
            .Include(x => x.Customer)
            .OrderBy(x => x.Id)
            .ToList();

        var added = false;
        foreach (var order in orders)
        {
            bool Matches(string actionPrefix) => logs.Any(x =>
                x.Action.StartsWith(actionPrefix, StringComparison.Ordinal)
                && (x.EntityId == order.Id
                    || (!string.IsNullOrWhiteSpace(order.Reference)
                        && x.Details != null
                        && (x.Details == order.Reference
                            || x.Details.Contains(order.Reference, StringComparison.Ordinal)))));

            if (!Matches("Placed") && !Matches("Scheduled") && !Matches("Checked out"))
            {
                Add(
                    db,
                    order.CustomerId,
                    PlacementAction(order, null),
                    "Order",
                    order.Id,
                    DescribeOrder(order),
                    SpecifyUtc(order.PlacedAt));
                added = true;
            }

            if (order.Status is OrderStatus.Placed or OrderStatus.Scheduled)
            {
                continue;
            }

            if (Matches("Changed order status") || Matches("Cancelled") || Matches("Released") || Matches("Completed") || Matches("Marked delivery"))
            {
                continue;
            }

            Add(
                db,
                order.StaffId ?? order.CustomerId,
                TransitionAction(OrderStatus.Placed, order.Status, false, null, order.SpecialInstructions),
                "Order",
                order.Id,
                DescribeOrder(order),
                SpecifyUtc(order.PlacedAt).AddMinutes(1));
            added = true;
        }

        if (added)
        {
            db.SaveChanges();
        }
    }

    private static DateTime SpecifyUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private static string Trim(string value, int max) =>
        value.Length <= max ? value : value[..max];
}
