using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using StackedHub.Api.Contracts;
using StackedHub.Domain;

namespace StackedHub.Tests;

public class OrderReliabilityTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public OrderReliabilityTests(ApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Place_order_records_status_history()
    {
        using var client = await SignIn("priya.nair@example.co.za");
        var order = await PlaceLemonade(client);
        var fetched = await client.GetFromJsonAsync<OrderDto>($"/api/orders/{order.Id}", Json.Options);
        Assert.NotNull(fetched);
        Assert.Contains(fetched.StatusHistory ?? [], x => x.Status == OrderStatus.Placed);
    }

    [Fact]
    public async Task Idempotency_key_replays_the_same_order()
    {
        using var client = await SignIn("priya.nair@example.co.za");
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var lemonade = menu!.First(x => x.Name == "Homemade Lemonade");
        var body = new PlaceOrderRequest(PaymentMethod.Cash, null, [new CartLineRequest(lemonade.Id, 1, null)]);
        client.DefaultRequestHeaders.Add("Idempotency-Key", $"test-{Guid.NewGuid():N}");

        var first = await client.PostAsJsonAsync("/api/orders", body, Json.Options);
        var second = await client.PostAsJsonAsync("/api/orders", body, Json.Options);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);

        var left = await first.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        var right = await second.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        Assert.Equal(left!.Id, right!.Id);
    }

    [Fact]
    public async Task Idempotency_key_rejects_a_different_payload()
    {
        using var client = await SignIn("priya.nair@example.co.za");
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var lemonade = menu!.First(x => x.Name == "Homemade Lemonade");
        var smash = menu.First(x => x.Name == "Double Smash Burger" && x.Available);
        client.DefaultRequestHeaders.Add("Idempotency-Key", $"test-{Guid.NewGuid():N}");

        var first = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(lemonade.Id, 1, null)]), Json.Options);
        first.EnsureSuccessStatusCode();

        var second = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(smash.Id, 1, null)]), Json.Options);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Completing_an_order_awards_loyalty_points_once()
    {
        using var customer = await SignIn("priya.nair@example.co.za");
        var before = await customer.GetFromJsonAsync<AuthUserDto>("/api/auth/me", Json.Options);
        var order = await PlaceLemonade(customer);

        using var staff = await SignIn("jason@stackedfoods.co.za");
        await PatchStatus(staff, order.Id, OrderStatus.InKitchen);
        await PatchStatus(staff, order.Id, OrderStatus.Ready);
        await PatchStatus(staff, order.Id, OrderStatus.Completed);

        var after = await customer.GetFromJsonAsync<AuthUserDto>("/api/auth/me", Json.Options);
        Assert.Equal(before!.LoyaltyPoints + 3, after!.LoyaltyPoints);
    }

    private static async Task PatchStatus(HttpClient staff, string orderId, OrderStatus status)
    {
        using var body = JsonContent.Create(new UpdateStatusRequest(status, null), options: Json.Options);
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/orders/{orderId}/status") { Content = body };
        var response = await staff.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    private static async Task<OrderDto> PlaceLemonade(HttpClient client)
    {
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var lemonade = menu!.First(x => x.Name == "Homemade Lemonade");
        var created = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(lemonade.Id, 1, null)]), Json.Options);
        created.EnsureSuccessStatusCode();
        return (await created.Content.ReadFromJsonAsync<OrderDto>(Json.Options))!;
    }

    private async Task<HttpClient> SignIn(string email)
    {
        var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Stacked123!"), Json.Options);
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>(Json.Options);
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return client;
    }
}
