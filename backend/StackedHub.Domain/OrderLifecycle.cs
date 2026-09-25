namespace StackedHub.Domain;

public static class OrderLifecycle
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> Allowed = new()
    {
        [OrderStatus.Placed] = [OrderStatus.InKitchen, OrderStatus.Cancelled],
        [OrderStatus.InKitchen] = [OrderStatus.Ready, OrderStatus.Cancelled],
        [OrderStatus.Ready] = [OrderStatus.Completed, OrderStatus.Cancelled],
        [OrderStatus.Completed] = [],
        [OrderStatus.Cancelled] = []
    };

    public static bool CanTransition(OrderStatus from, OrderStatus to) =>
        Allowed[from].Contains(to);

    public static bool CustomerCanCancel(OrderStatus status) =>
        status is OrderStatus.Placed;
}
