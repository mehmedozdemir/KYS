using Kys.Domain.Entities;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Interfaces.Repositories;

public interface IProductRepository
{
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetAllAsync(
        string? search, ProductType? type, ProductStatus? status,
        int page, int pageSize, CancellationToken ct = default);

    Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task AddAsync(Product product, CancellationToken ct = default);
    void Update(Product product);

    // Endpoints
    Task<IReadOnlyList<ProductEndpoint>> GetEndpointsAsync(Guid productId, CancellationToken ct = default);
    Task<ProductEndpoint?> GetEndpointByIdAsync(Guid id, CancellationToken ct = default);
    Task AddEndpointAsync(ProductEndpoint endpoint, CancellationToken ct = default);
    void UpdateEndpoint(ProductEndpoint endpoint);
    void DeleteEndpoint(ProductEndpoint endpoint);

    // Teams
    Task<ProductTeam?> GetTeamAssignmentAsync(Guid productId, Guid teamId, CancellationToken ct = default);
    Task AddTeamAssignmentAsync(ProductTeam assignment, CancellationToken ct = default);
    void RemoveTeamAssignment(ProductTeam assignment);

    // Person assignments
    Task<IReadOnlyList<ProductAssignment>> GetAssignmentsAsync(Guid productId, CancellationToken ct = default);
    Task<ProductAssignment?> GetPersonAssignmentAsync(Guid productId, Guid personId, CancellationToken ct = default);
    Task AddPersonAssignmentAsync(ProductAssignment assignment, CancellationToken ct = default);
    void UpdatePersonAssignment(ProductAssignment assignment);
    void RemovePersonAssignment(ProductAssignment assignment);

    // Resource templates
    Task<IReadOnlyList<ProductResourceTemplate>> GetResourceTemplatesAsync(Guid productId, CancellationToken ct = default);
    Task<ProductResourceTemplate?> GetResourceTemplateByIdAsync(Guid id, CancellationToken ct = default);
    Task AddResourceTemplateAsync(ProductResourceTemplate template, CancellationToken ct = default);
    void UpdateResourceTemplate(ProductResourceTemplate template);
    void DeleteResourceTemplate(ProductResourceTemplate template);
    Task<int> CountEnvironmentResourcesByTemplateAsync(Guid templateId, CancellationToken ct = default);
}
