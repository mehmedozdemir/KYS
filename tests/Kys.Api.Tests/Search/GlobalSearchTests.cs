using System.Net;
using System.Net.Http.Json;
using Kys.Api.Tests.Infrastructure;

namespace Kys.Api.Tests.Search;

public sealed class GlobalSearchTests(KysWebApplicationFactory factory)
    : IntegrationTestBase(factory)
{
    private readonly TestDataSeeder _seeder = new(factory);

    [Fact]
    public async Task Search_WithoutAuth_Returns401()
    {
        var response = await Client.GetAsync("/api/v1/search?q=test");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Search_ShortQuery_ReturnsEmptyResult()
    {
        await AuthenticateAsync();

        var response = await Client.GetAsync("/api/v1/search?q=ab");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<SearchResult>();
        Assert.NotNull(body);
        Assert.Empty(body.Customers);
        Assert.Empty(body.Products);
    }

    [Fact]
    public async Task Search_MatchingCustomer_ReturnsInResults()
    {
        await AuthenticateAsync();

        // Create a customer with a unique searchable name
        var createResp = await Client.PostAsJsonAsync("/api/v1/customers", new
        {
            Name = "Zeplin Yazılım A.Ş.",
            Code = "ZEPL",
        });
        createResp.EnsureSuccessStatusCode();

        var response = await Client.GetAsync("/api/v1/search?q=Zeplin&limit=5");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<SearchResult>();
        Assert.NotNull(body);
        Assert.Single(body.Customers);
        Assert.Equal("Zeplin Yazılım A.Ş.", body.Customers[0].Name);
        Assert.Equal("ZEPL", body.Customers[0].SubTitle);
    }

    [Fact]
    public async Task Search_MatchingProduct_ReturnsInResults()
    {
        await AuthenticateAsync();

        await Client.PostAsJsonAsync("/api/v1/products", new
        {
            Name = "Zirkon ERP Sistemi",
            Code = "ZRKN",
            ProductType = 0,
            Status = 1,
        });

        var response = await Client.GetAsync("/api/v1/search?q=Zirkon&limit=5");
        var body = await response.Content.ReadFromJsonAsync<SearchResult>();

        Assert.NotNull(body);
        Assert.Single(body.Products);
        Assert.Equal("Zirkon ERP Sistemi", body.Products[0].Name);
    }

    [Fact]
    public async Task Search_NoMatch_ReturnsEmptyCollections()
    {
        await AuthenticateAsync();

        var response = await Client.GetAsync("/api/v1/search?q=xyzzy9876notexist&limit=5");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<SearchResult>();
        Assert.NotNull(body);
        Assert.Empty(body.Customers);
        Assert.Empty(body.Products);
        Assert.Empty(body.People);
        Assert.Empty(body.Teams);
    }

    [Fact]
    public async Task Search_ArchivedCustomer_NotInResults()
    {
        await AuthenticateAsync();

        var createResp = await Client.PostAsJsonAsync("/api/v1/customers", new
        {
            Name = "Zumbul Arşiv A.Ş.",
            Code = "ZMBL",
        });
        var id = (await createResp.Content.ReadFromJsonAsync<CreatedResult>())!.Id;

        await Client.PostAsync($"/api/v1/customers/{id}/archive", null);

        var searchResp = await Client.GetAsync("/api/v1/search?q=Zumbul&limit=5");
        var body = await searchResp.Content.ReadFromJsonAsync<SearchResult>();

        Assert.Empty(body!.Customers);
    }

    private sealed record SearchResultItem(string Id, string Name, string? SubTitle, string Category, string? Status);
    private sealed record SearchResult(
        IReadOnlyList<SearchResultItem> Customers,
        IReadOnlyList<SearchResultItem> Products,
        IReadOnlyList<SearchResultItem> People,
        IReadOnlyList<SearchResultItem> Teams,
        IReadOnlyList<SearchResultItem>? Articles);
    private sealed record CreatedResult(Guid Id);
}
