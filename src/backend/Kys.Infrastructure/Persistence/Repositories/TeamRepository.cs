using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class TeamRepository(AppDbContext db) : ITeamRepository
{
    public async Task<Team?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Teams
            .Include(t => t.Memberships.Where(m => m.EndDate == null))
                .ThenInclude(m => m.Person)
            .Include(t => t.Memberships.Where(m => m.EndDate == null))
                .ThenInclude(m => m.OrganizationRole)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<IReadOnlyList<Team>> GetAllAsync(CancellationToken ct = default)
        => await db.Teams.OrderBy(t => t.Name).ToListAsync(ct);

    public async Task AddAsync(Team team, CancellationToken ct = default)
        => await db.Teams.AddAsync(team, ct);

    public void Update(Team team)
        => db.Teams.Update(team);

    public async Task<IReadOnlyList<OrganizationRole>> GetOrganizationRolesAsync(CancellationToken ct = default)
        => await db.OrganizationRoles.OrderBy(r => r.Name).ToListAsync(ct);
}
