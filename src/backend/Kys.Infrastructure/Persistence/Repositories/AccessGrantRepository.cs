using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class AccessGrantRepository(AppDbContext dbContext) : IAccessGrantRepository
{
    public async Task<IReadOnlyList<AccessGrant>> GetAllAsync(Guid? personId, CancellationToken ct = default)
    {
        var query = dbContext.AccessGrants.Include(g => g.Person).AsNoTracking();
        if (personId is { } pid)
            query = query.Where(g => g.PersonId == pid);
        return await query.OrderByDescending(g => g.GrantedAt).ToListAsync(ct);
    }

    public async Task<AccessGrant?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.AccessGrants.FirstOrDefaultAsync(g => g.Id == id, ct);

    public async Task AddAsync(AccessGrant grant, CancellationToken ct = default)
        => await dbContext.AccessGrants.AddAsync(grant, ct);

    public void Delete(AccessGrant grant)
        => dbContext.AccessGrants.Remove(grant);
}
