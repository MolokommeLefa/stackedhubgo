using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using StackedHub.Api.Contracts;
using StackedHub.Domain;

namespace StackedHub.Tests;

public class LoyaltyWalletTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public LoyaltyWalletTests(ApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Wallet_shows_balance_tier_and_reward_catalog()
    {
        using var client = await SignIn("priya.nair@example.co.za");
        var wallet = await client.GetFromJsonAsync<LoyaltyWalletDto>("/api/loyalty", Json.Options);

        Assert.NotNull(wallet);
        Assert.Equal(412, wallet.Balance);
        Assert.Equal("VIP", wallet.Tier);
        Assert.Contains("R10", wallet.EarnRule);
        Assert.Null(wallet.NextTier);
        Assert.Equal(3, wallet.Rewards.Count);
        Assert.All(wallet.Rewards, x => Assert.True(x.Affordable));
    }

    [Fact]
    public async Task New_customer_starts_on_the_new_tier_with_progress()
    {
        using var client = await Register($"loy-{Guid.NewGuid():N}@example.co.za");
        var wallet = await client.GetFromJsonAsync<LoyaltyWalletDto>("/api/loyalty", Json.Options);

        Assert.Equal(0, wallet!.Balance);
        Assert.Equal("New", wallet.Tier);
        Assert.Equal("Regular", wallet.NextTier!.Label);
        Assert.Equal(100, wallet.NextTier.Remaining);
        Assert.Equal("Free homemade lemonade", wallet.NextReward!.Label);
        Assert.False(wallet.Rewards[0].Affordable);
    }

    [Fact]
    public async Task Redeem_deducts_points_and_writes_a_ledger_row()
    {
        using var client = await Register($"redeem-{Guid.NewGuid():N}@example.co.za");
        var order = await PlaceAndComplete(client, "Double Smash Burger", 4);
        var before = await client.GetFromJsonAsync<LoyaltyWalletDto>("/api/loyalty", Json.Options);
        Assert.True(before!.Balance >= 50);

        var redeem = await client.PostAsJsonAsync("/api/loyalty/redeem", new RedeemLoyaltyRequest("drink"), Json.Options);
        redeem.EnsureSuccessStatusCode();
        var after = await redeem.Content.ReadFromJsonAsync<LoyaltyWalletDto>(Json.Options);

        Assert.Equal(before.Balance - 50, after!.Balance);
        Assert.Contains(after.Transactions, x => x.Type == "Redeem" && x.Points == -50 && x.Reason == "Free homemade lemonade");
        Assert.Contains(after.Transactions, x => x.Type == "Earn" && x.OrderId == order.Id);
    }

    [Fact]
    public async Task Redeem_rejects_unknown_rewards_and_short_balances()
    {
        using var client = await Register($"broke-{Guid.NewGuid():N}@example.co.za");
        var unknown = await client.PostAsJsonAsync("/api/loyalty/redeem", new RedeemLoyaltyRequest("missing"), Json.Options);
        var shortBalance = await client.PostAsJsonAsync("/api/loyalty/redeem", new RedeemLoyaltyRequest("drink"), Json.Options);

        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, shortBalance.StatusCode);
    }

    [Fact]
    public async Task Completing_an_order_appears_on_the_wallet_ledger()
    {
        using var customer = await Register($"earn-{Guid.NewGuid():N}@example.co.za");
        var order = await PlaceAndComplete(customer, "Homemade Lemonade", 1);
        var wallet = await customer.GetFromJsonAsync<LoyaltyWalletDto>("/api/loyalty", Json.Options);
        Assert.Equal(3, wallet!.Balance);
        Assert.Contains(wallet.Transactions, x => x.Type == "Earn" && x.Points == 3 && x.OrderId == order.Id);
    }

    [Fact]
    public async Task Staff_cannot_open_the_customer_wallet()
    {
        using var staff = await SignIn("jason@stackedfoods.co.za");
        var response = await staff.GetAsync("/api/loyalty");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<OrderDto> PlaceAndComplete(HttpClient customer, string menuName, int quantity)
    {
        var menu = await customer.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var item = menu!.First(x => x.Name == menuName && x.Available);
        var placed = await customer.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash, null, [new CartLineRequest(item.Id, quantity, null)]), Json.Options);
        placed.EnsureSuccessStatusCode();
        var order = await placed.Content.ReadFromJsonAsync<OrderDto>(Json.Options);

        using var staff = await SignIn("jason@stackedfoods.co.za");
        await PatchStatus(staff, order!.Id, OrderStatus.InKitchen);
        await PatchStatus(staff, order.Id, OrderStatus.Ready);
        await PatchStatus(staff, order.Id, OrderStatus.Completed);
        return order;
    }

    private static async Task PatchStatus(HttpClient staff, string orderId, OrderStatus status)
    {
        using var body = JsonContent.Create(new UpdateStatusRequest(status, null), options: Json.Options);
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/orders/{orderId}/status") { Content = body };
        var response = await staff.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    private async Task<HttpClient> Register(string email)
    {
        var client = _factory.CreateClient();
        var created = await client.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterRequest(email, "Stacked123!", "Loy", "Tester", null, null),
            Json.Options);
        created.EnsureSuccessStatusCode();
        var auth = await created.Content.ReadFromJsonAsync<AuthResponse>(Json.Options);
        Assert.NotNull(auth);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return client;
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
