using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class ProductRepository(AppDbContext dbContext) : IProductRepository
{
    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetAllAsync(
        string? search, ProductType? type, ProductStatus? status,
        int page, int pageSize, CancellationToken ct = default)
    {
        var query = dbContext.Products
            .Include(p => p.PoPerson)
            .Include(p => p.Teams).ThenInclude(pt => pt.Team)
            .Include(p => p.Assignments)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Code.Contains(search));

        if (type.HasValue)
            query = query.Where(p => p.ProductType == type.Value);

        if (status.HasValue)
            query = query.Where(p => p.Status == status.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.Products
            .Include(p => p.PoPerson)
            .Include(p => p.Teams).ThenInclude(t => t.Team)
            .Include(p => p.Assignments).ThenInclude(a => a.Person)
            .Include(p => p.Endpoints)
            .Include(p => p.ResourceTemplates).ThenInclude(rt => rt.ResourceType)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddAsync(Product product, CancellationToken ct = default)
        => await dbContext.Products.AddAsync(product, ct);

    public void Update(Product product)
        => dbContext.Products.Update(product);

    public async Task<IReadOnlyList<ProductEndpoint>> GetEndpointsAsync(Guid productId, CancellationToken ct = default)
        => await dbContext.ProductEndpoints
            .AsNoTracking()
            .Where(e => e.ProductId == productId)
            .OrderBy(e => e.SortOrder)
            .ToListAsync(ct);

    public async Task<ProductEndpoint?> GetEndpointByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.ProductEndpoints.FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task AddEndpointAsync(ProductEndpoint endpoint, CancellationToken ct = default)
        => await dbContext.ProductEndpoints.AddAsync(endpoint, ct);

    public void UpdateEndpoint(ProductEndpoint endpoint)
        => dbContext.ProductEndpoints.Update(endpoint);

    public void DeleteEndpoint(ProductEndpoint endpoint)
        => dbContext.ProductEndpoints.Remove(endpoint);

    public async Task<ProductTeam?> GetTeamAssignmentAsync(Guid productId, Guid teamId, CancellationToken ct = default)
        => await dbContext.ProductTeams
            .FirstOrDefaultAsync(pt => pt.ProductId == productId && pt.TeamId == teamId, ct);

    public async Task AddTeamAssignmentAsync(ProductTeam assignment, CancellationToken ct = default)
        => await dbContext.ProductTeams.AddAsync(assignment, ct);

    public async Task<IReadOnlyList<ProductAssignment>> GetAssignmentsAsync(Guid productId, CancellationToken ct = default)
        => await dbContext.ProductAssignments
            .Include(a => a.Person)
            .AsNoTracking()
            .Where(a => a.ProductId == productId)
            .ToListAsync(ct);

    public async Task<ProductAssignment?> GetPersonAssignmentAsync(Guid productId, Guid personId, CancellationToken ct = default)
        => await dbContext.ProductAssignments
            .FirstOrDefaultAsync(a => a.ProductId == productId && a.PersonId == personId && a.IsActive, ct);

    public async Task AddPersonAssignmentAsync(ProductAssignment assignment, CancellationToken ct = default)
        => await dbContext.ProductAssignments.AddAsync(assignment, ct);

    public void UpdatePersonAssignment(ProductAssignment assignment)
        => dbContext.ProductAssignments.Update(assignment);

    public async Task<IReadOnlyList<ProductResourceTemplate>> GetResourceTemplatesAsync(Guid productId, CancellationToken ct = default)
        => await dbContext.ProductResourceTemplates
            .Include(rt => rt.ResourceType)
            .AsNoTracking()
            .Where(rt => rt.ProductId == productId)
            .OrderBy(rt => rt.SortOrder)
            .ToListAsync(ct);

    public async Task<ProductResourceTemplate?> GetResourceTemplateByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.ProductResourceTemplates.FindAsync([id], ct);

    public async Task AddResourceTemplateAsync(ProductResourceTemplate template, CancellationToken ct = default)
        => await dbContext.ProductResourceTemplates.AddAsync(template, ct);

    public void UpdateResourceTemplate(ProductResourceTemplate template)
        => dbContext.ProductResourceTemplates.Update(template);

    public void DeleteResourceTemplate(ProductResourceTemplate template)
        => dbContext.ProductResourceTemplates.Remove(template);

    public async Task<int> CountEnvironmentResourcesByTemplateAsync(Guid templateId, CancellationToken ct = default)
        => await dbContext.EnvironmentResources.CountAsync(r => r.ProductResourceTemplateId == templateId && !r.IsDeleted, ct);
}
