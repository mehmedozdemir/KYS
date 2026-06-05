using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class SystemRoleRepository(AppDbContext dbContext) : ISystemRoleRepository
{
    public async Task<IReadOnlyList<SystemRole>> GetAllAsync(CancellationToken cancellationToken = default)
        => await dbContext.SystemRoles.AsNoTracking().ToListAsync(cancellationToken);

    public async Task<SystemRole?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await dbContext.SystemRoles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<IReadOnlyList<PersonSystemRole>> GetByPersonAsync(
        Guid personId, CancellationToken cancellationToken = default)
        => await dbContext.PersonSystemRoles
            .Include(x => x.SystemRole)
            .Where(x => x.PersonId == personId)
            .ToListAsync(cancellationToken);

    public async Task AssignToPersonAsync(PersonSystemRole assignment, CancellationToken cancellationToken = default)
        => await dbContext.PersonSystemRoles.AddAsync(assignment, cancellationToken);

    public async Task<PersonSystemRole?> GetAssignmentAsync(
        Guid personId, Guid systemRoleId, CancellationToken cancellationToken = default)
        => await dbContext.PersonSystemRoles
            .FirstOrDefaultAsync(x => x.PersonId == personId && x.SystemRoleId == systemRoleId, cancellationToken);

    public void RemoveAssignment(PersonSystemRole assignment)
        => dbContext.PersonSystemRoles.Remove(assignment);
}
