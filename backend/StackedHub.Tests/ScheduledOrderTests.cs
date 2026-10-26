using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StackedHub.Api.Contracts;
using StackedHub.Api.Services;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Tests;

public class TightKitchenFactory : ApiFactory
{
    protected override IEnumerable<KeyValuePair<string, string?>> ExtraConfig() =>
    [
        new("Kitchen:MaxOrdersPerSlot", "1")
    ];
}

public class ScheduledOrderTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public ScheduledOrderTests(ApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Customer_can_schedule_an_order_without_holding_stock()
    {
        using var client = await SignIn(_factory, "priya.nair@example.co.za");
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var smash = menu!.First(x => x.Name == "Double Smash Burger" && x.Available);
        var slot = await FirstOpenSlot(client);

        var created = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Card,
            "Collect after work",
            [new CartLineRequest(smash.Id, 1, null)],
            OrderChannel.Website,
            slot.Start), Json.Options);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var order = await created.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        Assert.Equal(OrderStatus.Scheduled, order!.Status);
        Assert.Equal("Scheduled", order.Fulfilment);
        Assert.Equal(slot.Start, order.ScheduledFor);

        var after = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        Assert.Equal(smash.Stock, after!.First(x => x.Id == smash.Id).Stock);
    }

    [Fact]
    public async Task Customer_can_cancel_a_scheduled_order()
    {
        using var client = await SignIn(_factory, "priya.nair@example.co.za");
        var order = await PlaceScheduled(client);
        var cancel = await client.PostAsync($"/api/orders/{order.Id}/cancel", null);
        cancel.EnsureSuccessStatusCode();
        var updated = await cancel.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        Assert.Equal(OrderStatus.Cancelled, updated!.Status);
    }

    [Fact]
    public async Task Scheduled_orders_are_hidden_from_the_default_kitchen_queue()
    {
        using var customer = await SignIn(_factory, "priya.nair@example.co.za");
        var order = await PlaceScheduled(customer);

        using var staff = await SignIn(_factory, "jason@stackedfoods.co.za");
        var queue = await staff.GetFromJsonAsync<List<OrderDto>>("/api/orders", Json.Options);
        Assert.DoesNotContain(queue!, x => x.Id == order.Id);

        var scheduled = await staff.GetFromJsonAsync<List<OrderDto>>("/api/orders?status=Scheduled", Json.Options);
        Assert.Contains(scheduled!, x => x.Id == order.Id);
    }

    [Fact]
    public async Task Releasing_a_scheduled_order_reserves_stock_and_places_it()
    {
        using var customer = await SignIn(_factory, "priya.nair@example.co.za");
        var menu = await customer.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var smash = menu!.First(x => x.Name == "Double Smash Burger" && x.Available);
        var slot = await FirstOpenSlot(customer);
        var created = await customer.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(smash.Id, 1, null)], null, slot.Start), Json.Options);
        created.EnsureSuccessStatusCode();
        var order = await created.Content.ReadFromJsonAsync<OrderDto>(Json.Options);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var entity = await db.Orders.SingleAsync(x => x.Id == int.Parse(order!.Id));
        entity.ScheduledFor = DateTime.UtcNow.AddMinutes(-1);
        entity.PrepLeadMinutes = 20;
        await db.SaveChangesAsync();

        var orders = scope.ServiceProvider.GetRequiredService<OrderService>();
        var released = await orders.ReleaseDueScheduledOrders(CancellationToken.None);
        Assert.True(released >= 1);

        var fetched = await customer.GetFromJsonAsync<OrderDto>($"/api/orders/{order.Id}", Json.Options);
        Assert.Equal(OrderStatus.Placed, fetched!.Status);

        var after = await customer.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        Assert.Equal(smash.Stock - 1, after!.First(x => x.Id == smash.Id).Stock);
    }

    private static async Task<OrderDto> PlaceScheduled(HttpClient client)
    {
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var lemonade = menu!.First(x => x.Name == "Homemade Lemonade");
        var slot = await FirstOpenSlot(client);
        var created = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(lemonade.Id, 1, null)], null, slot.Start), Json.Options);
        created.EnsureSuccessStatusCode();
        return (await created.Content.ReadFromJsonAsync<OrderDto>(Json.Options))!;
    }

    private static async Task<OrderSlotDto> FirstOpenSlot(HttpClient client)
    {
        var slots = await client.GetFromJsonAsync<List<OrderSlotDto>>("/api/orders/slots", Json.Options);
        var open = slots!.FirstOrDefault(x => x.Available);
        Assert.NotNull(open);
        return open;
    }

    private static async Task<HttpClient> SignIn(ApiFactory factory, string email)
    {
        var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Stacked123!"), Json.Options);
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>(Json.Options);
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return client;
    }
}

public class ScheduledCapacityTests : IClassFixture<TightKitchenFactory>
{
    private readonly TightKitchenFactory _factory;

    public ScheduledCapacityTests(TightKitchenFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Full_collection_slot_is_rejected()
    {
        using var client = await SignIn();
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var lemonade = menu!.First(x => x.Name == "Homemade Lemonade");
        var slots = await client.GetFromJsonAsync<List<OrderSlotDto>>("/api/orders/slots", Json.Options);
        var slot = slots!.First(x => x.Available);

        var first = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(lemonade.Id, 1, null)], null, slot.Start), Json.Options);
        first.EnsureSuccessStatusCode();

        var second = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(lemonade.Id, 1, null)], null, slot.Start), Json.Options);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    private async Task<HttpClient> SignIn()
    {
        var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("priya.nair@example.co.za", "Stacked123!"), Json.Options);
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>(Json.Options);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }
}
