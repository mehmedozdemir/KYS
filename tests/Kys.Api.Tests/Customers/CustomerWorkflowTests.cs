using System.Net;
using System.Net.Http.Json;
using Kys.Api.Tests.Infrastructure;

namespace Kys.Api.Tests.Customers;

public sealed class CustomerWorkflowTests(KysWebApplicationFactory factory)
    : IntegrationTestBase(factory)
{
    // ── Create ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidRequest_Returns201WithId()
    {
        await AuthenticateAsync();

        var response = await Client.PostAsJsonAsync("/api/v1/customers", new
        {
            Name = "Acme Corp",
            Code = "ACME",
            ShortName = "Acme",
            Sector = "Teknoloji",
            Country = "TR",
            City = "İstanbul",
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<CreatedResult>();
        Assert.NotEqual(Guid.Empty, body!.Id);
    }

    [Fact]
    public async Task Create_MissingRequiredFields_Returns422()
    {
        await AuthenticateAsync();

        var response = await Client.PostAsJsonAsync("/api/v1/customers", new
        {
            Name = "",  // required
            Code = "",  // required
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithoutAuth_Returns401()
    {
        var response = await Client.PostAsJsonAsync("/api/v1/customers", new
        {
            Name = "No Auth Corp",
            Code = "NOAUTH",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Read ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ExistingCustomer_Returns200WithDetails()
    {
        await AuthenticateAsync();

        var createResp = await Client.PostAsJsonAsync("/api/v1/customers", new
        {
            Name = "Get Test Corp",
            Code = "GETTEST",
            City = "Ankara",
        });
        var created = await createResp.Content.ReadFromJsonAsync<CreatedResult>();

        var response = await Client.GetAsync($"/api/v1/customers/{created!.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var detail = await response.Content.ReadFromJsonAsync<CustomerDetail>();
        Assert.Equal("Get Test Corp", detail!.Name);
        Assert.Equal("GETTEST", detail.Code);
        Assert.Equal("Ankara", detail.City);
    }

    [Fact]
    public async Task GetById_NonExistent_Returns404()
    {
        await AuthenticateAsync();

        var response = await Client.GetAsync($"/api/v1/customers/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── List (archived filter) ─────────────────────────────────────────────

    [Fact]
    public async Task GetAll_DefaultRequest_ExcludesArchivedCustomers()
    {
        await AuthenticateAsync();

        // Create two customers
        var active = await CreateCustomerAsync("Active Customer", "ACTIVE");
        var toArchive = await CreateCustomerAsync("Archived Customer", "ARCHIVED");

        // Archive one
        await Client.PostAsync($"/api/v1/customers/{toArchive}/archive", null);

        var listResp = await Client.GetAsync("/api/v1/customers");
        var list = await listResp.Content.ReadFromJsonAsync<PagedResult<CustomerSummary>>();

        var ids = list!.Items.Select(c => c.Id).ToList();
        Assert.Contains(active, ids);
        Assert.DoesNotContain(toArchive, ids);
    }

    [Fact]
    public async Task GetAll_IncludeArchived_ReturnsAllCustomers()
    {
        await AuthenticateAsync();

        var active = await CreateCustomerAsync("Active Customer 2", "ACTIVE2");
        var toArchive = await CreateCustomerAsync("Archived Customer 2", "ARCHIVED2");

        await Client.PostAsync($"/api/v1/customers/{toArchive}/archive", null);

        var listResp = await Client.GetAsync("/api/v1/customers?includeArchived=true");
        var list = await listResp.Content.ReadFromJsonAsync<PagedResult<CustomerSummary>>();

        var ids = list!.Items.Select(c => c.Id).ToList();
        Assert.Contains(active, ids);
        Assert.Contains(toArchive, ids);
    }

    // ── Status lifecycle ───────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_ToChurned_SetsServiceEndedAtAndArchivesCustomer()
    {
        await AuthenticateAsync();

        var id = await CreateCustomerAsync("Churned Corp", "CHURN");

        var patchResp = await Client.PatchAsJsonAsync($"/api/v1/customers/{id}/status", new
        {
            NewStatus = 4,  // Churned
            ServiceEndedAt = "2026-06-01",
            ChurnReason = "Budget cut",
        });
        Assert.Equal(HttpStatusCode.NoContent, patchResp.StatusCode);

        var detail = await GetCustomerAsync(id);
        Assert.Equal("Churned", detail.Status);
        Assert.True(detail.IsArchived);
        Assert.Equal("Budget cut", detail.ChurnReason);
        Assert.NotNull(detail.ServiceEndedAt);
    }

    // ── Archive / Restore ──────────────────────────────────────────────────

    [Fact]
    public async Task Archive_ExistingCustomer_SetsIsArchivedTrue()
    {
        await AuthenticateAsync();

        var id = await CreateCustomerAsync("Archive Me Corp", "ARCHME");

        var archiveResp = await Client.PostAsync($"/api/v1/customers/{id}/archive", null);
        Assert.Equal(HttpStatusCode.NoContent, archiveResp.StatusCode);

        var detail = await GetCustomerAsync(id);
        Assert.True(detail.IsArchived);
        Assert.NotNull(detail.ArchivedAt);
    }

    [Fact]
    public async Task Restore_ArchivedCustomer_SetsIsArchivedFalse()
    {
        await AuthenticateAsync();

        var id = await CreateCustomerAsync("Restore Me Corp", "RESTME");

        await Client.PostAsync($"/api/v1/customers/{id}/archive", null);
        var restoreResp = await Client.PostAsync($"/api/v1/customers/{id}/restore", null);

        Assert.Equal(HttpStatusCode.NoContent, restoreResp.StatusCode);

        var detail = await GetCustomerAsync(id);
        Assert.False(detail.IsArchived);
        Assert.Null(detail.ArchivedAt);
    }

    // ── Update ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ValidRequest_PersistsChanges()
    {
        await AuthenticateAsync();

        var id = await CreateCustomerAsync("Update Corp", "UPDCORP");

        var putResp = await Client.PutAsJsonAsync($"/api/v1/customers/{id}", new
        {
            Name = "Updated Corp",
            ShortName = "UpdCorp",
            Description = "Updated description",
            Sector = "Fintech",
            Country = "TR",
            City = "İzmir",
            PrimaryContactName = "Ali Veli",
            PrimaryContactEmail = "ali@updated.com",
            PrimaryContactPhone = "+90 555 000 00 00",
            CustomFields = new { },
        });

        Assert.Equal(HttpStatusCode.NoContent, putResp.StatusCode);

        var detail = await GetCustomerAsync(id);
        Assert.Equal("Updated Corp", detail.Name);
        Assert.Equal("İzmir", detail.City);
        Assert.Equal("ali@updated.com", detail.PrimaryContactEmail);
    }

    // ── Soft delete ────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ExistingCustomer_Returns204AndHidesFromList()
    {
        await AuthenticateAsync();

        var id = await CreateCustomerAsync("Delete Corp", "DELCORP");

        var deleteResp = await Client.DeleteAsync($"/api/v1/customers/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        // Soft-deleted customer should not appear even with includeArchived
        var listResp = await Client.GetAsync("/api/v1/customers?includeArchived=true");
        var list = await listResp.Content.ReadFromJsonAsync<PagedResult<CustomerSummary>>();
        Assert.DoesNotContain(id, list!.Items.Select(c => c.Id));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private async Task<Guid> CreateCustomerAsync(string name, string code)
    {
        var resp = await Client.PostAsJsonAsync("/api/v1/customers", new { Name = name, Code = code });
        resp.EnsureSuccessStatusCode();
        return (await resp.Content.ReadFromJsonAsync<CreatedResult>())!.Id;
    }

    private async Task<CustomerDetail> GetCustomerAsync(Guid id)
    {
        var resp = await Client.GetAsync($"/api/v1/customers/{id}");
        resp.EnsureSuccessStatusCode();
        return (await resp.Content.ReadFromJsonAsync<CustomerDetail>())!;
    }

    // ── DTOs ───────────────────────────────────────────────────────────────

    private sealed record CreatedResult(Guid Id);
    // Status is returned as string (JsonStringEnumConverter is globally registered)
    private sealed record CustomerDetail(
        Guid Id, string Name, string Code, string? City,
        string Status, bool IsArchived, string? ArchivedAt,
        string? ServiceEndedAt, string? ChurnReason,
        string? PrimaryContactEmail);
    private sealed record CustomerSummary(Guid Id, string Name, string Code, bool IsArchived);
    private sealed record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount);
}
