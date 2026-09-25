using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using StackedHub.Api;
using StackedHub.Api.Contracts;
using StackedHub.Domain;

namespace StackedHub.Tests;

internal static class Json
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        Converters =
        {
            new JsonStringEnumConverter(),
            new OrderStatusJsonConverter(),
            new OrderChannelJsonConverter()
        }
    };
}

public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"stackedhub-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["UseSqlite"] = "true",
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={_dbPath}",
                ["Gemini:ApiKey"] = ""
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        foreach (var extra in new[] { _dbPath, _dbPath + "-shm", _dbPath + "-wal" })
        {
            if (File.Exists(extra))
            {
                File.Delete(extra);
            }
        }
    }
}

public class ApiFlowTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public ApiFlowTests(ApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Menu_is_public_and_matches_frontend_catalogue()
    {
        using var client = _factory.CreateClient();
        var items = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        Assert.NotNull(items);
        Assert.Contains(items, x => x.Name == "Double Smash Burger" && x.Available);
        Assert.Contains(items, x => x.Name == "Koeksister Bites" && !x.Available);
        Assert.Contains(items, x => x.Name == "Peri-Peri Chicken Stack" && x.Spicy);
    }

    [Fact]
    public async Task Demo_customer_can_login_and_place_pickup_order()
    {
        using var client = await SignIn("priya.nair@example.co.za");
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var smash = menu!.First(x => x.Name == "Double Smash Burger");
        var response = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash,
            "No pickles",
            [new CartLineRequest(smash.Id, 1, null)]), Json.Options);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        Assert.Equal(OrderStatus.Placed, order!.Status);
        Assert.Equal(OrderChannel.Website, order.Channel);
        Assert.Equal(145m, order.Total);
        Assert.StartsWith("#", order.Reference);
        Assert.False(string.IsNullOrWhiteSpace(order.Id));
    }

    [Fact]
    public async Task Unavailable_item_cannot_be_ordered()
    {
        using var client = await SignIn("priya.nair@example.co.za");
        var menu = await client.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var soldOut = menu!.First(x => !x.Available);
        var response = await client.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Cash,
            null,
            [new CartLineRequest(soldOut.Id, 1, null)]), Json.Options);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Assistant_answers_from_menu_and_faqs()
    {
        using var client = _factory.CreateClient();
        var menuAsk = await client.PostAsJsonAsync("/api/assistant", new AssistantRequest("Is the Smash Burger available and how much is it?"), Json.Options);
        menuAsk.EnsureSuccessStatusCode();
        var menuReply = await menuAsk.Content.ReadFromJsonAsync<AssistantResponse>(Json.Options);
        Assert.Equal("menu", menuReply!.Source);
        Assert.Contains("Smash Burger", menuReply.Reply, StringComparison.OrdinalIgnoreCase);

        var payAsk = await client.PostAsJsonAsync("/api/assistant", new AssistantRequest("Can I pay by card?"), Json.Options);
        var payReply = await payAsk.Content.ReadFromJsonAsync<AssistantResponse>(Json.Options);
        Assert.Equal("faq", payReply!.Source);
        Assert.Contains("Cash or Card", payReply.Reply, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Ai_recommendations_return_grounded_fallback_without_gemini_key()
    {
        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/ai/recommendations", new AiRecommendationRequest("something spicy", null), Json.Options);
        response.EnsureSuccessStatusCode();
        var suggestions = await response.Content.ReadFromJsonAsync<List<AiSuggestion>>(Json.Options);
        Assert.NotNull(suggestions);
        Assert.NotEmpty(suggestions);
        Assert.All(suggestions, item => Assert.False(string.IsNullOrWhiteSpace(item.Name)));
        Assert.Contains(suggestions, x => x.Name.Contains("Peri-Peri", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Chakalaka", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Bunny", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Customer_cannot_open_staff_or_customer_crm_routes()
    {
        using var client = await SignIn("priya.nair@example.co.za");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/staff/orders")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/customers")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/reports")).StatusCode);
    }

    [Fact]
    public async Task Staff_can_move_order_through_kitchen()
    {
        using var customer = await SignIn("priya.nair@example.co.za");
        var menu = await customer.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var lemonade = menu!.First(x => x.Name == "Homemade Lemonade");
        var created = await customer.PostAsJsonAsync("/api/orders", new PlaceOrderRequest(
            PaymentMethod.Card,
            null,
            [new CartLineRequest(lemonade.Id, 1, null)]), Json.Options);
        created.EnsureSuccessStatusCode();
        var order = await created.Content.ReadFromJsonAsync<OrderDto>(Json.Options);

        using var staff = await SignIn("jason@stackedfoods.co.za");
        using var patchBody = JsonContent.Create(new UpdateStatusRequest(OrderStatus.InKitchen, null), options: Json.Options);
        using var patchRequest = new HttpRequestMessage(HttpMethod.Patch, $"/api/orders/{order!.Id}/status") { Content = patchBody };
        var patch = await staff.SendAsync(patchRequest);
        patch.EnsureSuccessStatusCode();
        var updated = await patch.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        Assert.Equal(OrderStatus.InKitchen, updated!.Status);

        var queue = await staff.GetFromJsonAsync<List<OrderDto>>("/api/orders", Json.Options);
        Assert.Contains(queue!, x => x.Id == order.Id);
    }

    [Fact]
    public async Task Admin_can_read_frontend_contract_routes()
    {
        using var client = await SignIn("thandi@stackedfoods.co.za");
        (await client.GetAsync("/api/customers")).EnsureSuccessStatusCode();
        (await client.GetAsync("/api/promotions")).EnsureSuccessStatusCode();
        (await client.GetAsync("/api/reports")).EnsureSuccessStatusCode();
        (await client.GetAsync("/api/audit-logs")).EnsureSuccessStatusCode();
        (await client.GetAsync("/api/inventory")).EnsureSuccessStatusCode();
        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest("priya.nair@example.co.za"), Json.Options);
        Assert.Equal(HttpStatusCode.OK, forgot.StatusCode);
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
