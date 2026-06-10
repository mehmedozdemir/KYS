using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IAccessGrantRepository
{
    Task<IReadOnlyList<AccessGrant>> GetAllAsync(Guid? personId, CancellationToken ct = default);
    Task<AccessGrant?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(AccessGrant grant, CancellationToken ct = default);
    void Delete(AccessGrant grant);
}
