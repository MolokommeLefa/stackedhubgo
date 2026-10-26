using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using StackedHub.Api.Contracts;
using StackedHub.Domain;

namespace StackedHub.Tests;

public class GroupOrderTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public GroupOrderTests(ApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Host_creates_a_shareable_basket_and_guest_customer_joins()
    {
        using var host = await SignIn("priya.nair@example.co.za");
        var created = await host.PostAsJsonAsync("/api/groups", new CreateGroupBasketRequest("Office lunch"), Json.Options);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var basket = await created.Content.ReadFromJsonAsync<GroupBasketDto>(Json.Options);
        Assert.Equal(GroupBasketStatus.Open, basket!.Status);
        Assert.False(string.IsNullOrWhiteSpace(basket.JoinCode));
        Assert.Contains(basket.Participants, x => x.IsHost);

        using var guest = await SignIn("marcus.bell@example.co.za");
        var joined = await guest.PostAsJsonAsync("/api/groups/join", new JoinGroupBasketRequest(basket.JoinCode), Json.Options);
        joined.EnsureSuccessStatusCode();
        var after = await joined.Content.ReadFromJsonAsync<GroupBasketDto>(Json.Options);
        Assert.Equal(2, after!.Participants.Count);
    }

    [Fact]
    public async Task Participants_can_customise_their_own_items_and_see_a_combined_summary()
    {
        var (host, guest, basket) = await OpenGroup();
        var menu = await host.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var smash = menu!.First(x => x.Name == "Double Smash Burger" && x.Available);
        var lemonade = menu.First(x => x.Name == "Homemade Lemonade");

        var hostAdd = await host.PostAsJsonAsync($"/api/groups/{basket.Id}/items", new UpsertGroupItemRequest(smash.Id, 1, "No pickles"), Json.Options);
        hostAdd.EnsureSuccessStatusCode();
        var guestAdd = await guest.PostAsJsonAsync($"/api/groups/{basket.Id}/items", new UpsertGroupItemRequest(lemonade.Id, 2, "Extra ice"), Json.Options);
        var summary = await guestAdd.Content.ReadFromJsonAsync<GroupBasketDto>(Json.Options);

        Assert.Equal(2, summary!.Items.Count);
        Assert.Equal(145m + 64m, summary.Total);
        Assert.Contains(summary.Items, x => x.SpecialInstructions == "No pickles");
        Assert.Contains(summary.Items, x => x.Quantity == 2 && x.Name == "Homemade Lemonade");
    }

    [Fact]
    public async Task Guest_cannot_edit_the_host_item()
    {
        var (host, guest, basket) = await OpenGroup();
        var menu = await host.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var smash = menu!.First(x => x.Name == "Double Smash Burger" && x.Available);
        var added = await host.PostAsJsonAsync($"/api/groups/{basket.Id}/items", new UpsertGroupItemRequest(smash.Id, 1, null), Json.Options);
        var withItem = await added.Content.ReadFromJsonAsync<GroupBasketDto>(Json.Options);
        var itemId = withItem!.Items[0].Id;

        var edit = await guest.SendAsync(new HttpRequestMessage(HttpMethod.Patch, $"/api/groups/{basket.Id}/items/{itemId}")
        {
            Content = JsonContent.Create(new UpsertGroupItemRequest(smash.Id, 2, "Stolen"), options: Json.Options)
        });
        Assert.Equal(HttpStatusCode.Forbidden, edit.StatusCode);
    }

    [Fact]
    public async Task Checkout_places_one_order_with_per_person_lines()
    {
        var (host, guest, basket) = await OpenGroup();
        var menu = await host.GetFromJsonAsync<List<MenuItemDto>>("/api/menu", Json.Options);
        var smash = menu!.First(x => x.Name == "Double Smash Burger" && x.Available);
        var lemonade = menu.First(x => x.Name == "Homemade Lemonade");
        (await host.PostAsJsonAsync($"/api/groups/{basket.Id}/items", new UpsertGroupItemRequest(smash.Id, 1, "No pickles"), Json.Options)).EnsureSuccessStatusCode();
        (await guest.PostAsJsonAsync($"/api/groups/{basket.Id}/items", new UpsertGroupItemRequest(lemonade.Id, 1, null), Json.Options)).EnsureSuccessStatusCode();

        var checkout = await host.PostAsJsonAsync($"/api/groups/{basket.Id}/checkout", new CheckoutGroupBasketRequest(PaymentMethod.Card), Json.Options);
        checkout.EnsureSuccessStatusCode();
        var order = await checkout.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        Assert.Equal(177m, order!.Total);
        Assert.Equal(2, order.Items.Count);
        Assert.Contains(order.Items, x => x.AddedByName == "Marcus Bell");
        Assert.Contains(order.Items, x => x.SpecialInstructions == "No pickles");

        var replay = await host.PostAsJsonAsync($"/api/groups/{basket.Id}/checkout", new CheckoutGroupBasketRequest(PaymentMethod.Card), Json.Options);
        replay.EnsureSuccessStatusCode();
        var again = await replay.Content.ReadFromJsonAsync<OrderDto>(Json.Options);
        Assert.Equal(order.Id, again!.Id);

        var locked = await host.GetFromJsonAsync<GroupBasketDto>($"/api/groups/{basket.Id}", Json.Options);
        Assert.Equal(GroupBasketStatus.Converted, locked!.Status);
        Assert.Equal(order.Id, locked.OrderId);
    }

    [Fact]
    public async Task Staff_cannot_create_a_group_order()
    {
        using var staff = await SignIn("jason@stackedfoods.co.za");
        var response = await staff.PostAsJsonAsync("/api/groups", new CreateGroupBasketRequest(null), Json.Options);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Outsider_cannot_read_a_group_basket()
    {
        using var host = await SignIn("priya.nair@example.co.za");
        var created = await host.PostAsJsonAsync("/api/groups", new CreateGroupBasketRequest(null), Json.Options);
        var basket = await created.Content.ReadFromJsonAsync<GroupBasketDto>(Json.Options);

        using var outsider = await SignIn("elena.costa@example.co.za");
        var get = await outsider.GetAsync($"/api/groups/{basket!.Id}");
        Assert.Equal(HttpStatusCode.Forbidden, get.StatusCode);
    }

    private async Task<(HttpClient Host, HttpClient Guest, GroupBasketDto Basket)> OpenGroup()
    {
        var host = await SignIn("priya.nair@example.co.za");
        var created = await host.PostAsJsonAsync("/api/groups", new CreateGroupBasketRequest(null), Json.Options);
        created.EnsureSuccessStatusCode();
        var basket = await created.Content.ReadFromJsonAsync<GroupBasketDto>(Json.Options);
        var guest = await SignIn("marcus.bell@example.co.za");
        (await guest.PostAsJsonAsync("/api/groups/join", new JoinGroupBasketRequest(basket!.JoinCode), Json.Options)).EnsureSuccessStatusCode();
        return (host, guest, basket);
    }

    private async Task<HttpClient> SignIn(string email)
    {
        var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Stacked123!"), Json.Options);
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>(Json.Options);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }
}
