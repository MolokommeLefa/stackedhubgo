using StackedHub.Domain;

namespace StackedHub.Tests;

public class OrderLifecycleTests
{
    [Theory]
    [InlineData(OrderStatus.Placed, OrderStatus.InKitchen, true)]
    [InlineData(OrderStatus.Placed, OrderStatus.Completed, false)]
    [InlineData(OrderStatus.InKitchen, OrderStatus.Ready, true)]
    [InlineData(OrderStatus.Ready, OrderStatus.Completed, true)]
    [InlineData(OrderStatus.Completed, OrderStatus.Cancelled, false)]
    public void Status_machine_matches_frontend_board(OrderStatus from, OrderStatus to, bool allowed)
    {
        Assert.Equal(allowed, OrderLifecycle.CanTransition(from, to));
    }

    [Fact]
    public void Customer_can_only_cancel_while_placed()
    {
        Assert.True(OrderLifecycle.CustomerCanCancel(OrderStatus.Placed));
        Assert.False(OrderLifecycle.CustomerCanCancel(OrderStatus.InKitchen));
        Assert.False(OrderLifecycle.CustomerCanCancel(OrderStatus.Ready));
    }
}
