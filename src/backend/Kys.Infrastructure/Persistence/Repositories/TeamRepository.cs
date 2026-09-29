using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class TeamRepository(AppDbContext db) : ITeamRepository
{
    public async Task<Team?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.Teams
            .Include(t => t.Memberships)
                .ThenInclude(m => m.Person)
            .Include(t => t.Memberships)
                .ThenInclude(m => m.OrganizationRole)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<IReadOnlyList<Team>> GetAllAsync(CancellationToken ct = default)
        => await db.Teams
            .Include(t => t.Memberships)
            .OrderBy(t => t.Name)
            .ToListAsync(ct);

    public async Task AddAsync(Team team, CancellationToken ct = default)
        => await db.Teams.AddAsync(team, ct);

    public void Update(Team team)
        => db.Teams.Update(team);

    public async Task<IReadOnlyList<OrganizationRole>> GetOrganizationRolesAsync(CancellationToken ct = default)
        => await db.OrganizationRoles.OrderBy(r => r.Name).ToListAsync(ct);

    public async Task<OrganizationRole?> GetOrganizationRoleByIdAsync(Guid id, CancellationToken ct = default)
        => await db.OrganizationRoles.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<bool> OrganizationRoleNameExistsAsync(string name, Guid? excludeId, CancellationToken ct = default)
        => await db.OrganizationRoles.AnyAsync(r => r.Name.ToLower() == name.ToLower() && r.Id != excludeId, ct);

    // Devam eden (bitiş tarihi olmayan) üyelikler
    public async Task<int> CountActiveMembershipsForRoleAsync(Guid roleId, CancellationToken ct = default)
        => await db.TeamMemberships.CountAsync(m => m.OrganizationRoleId == roleId && m.EndDate == null, ct);

    public async Task AddOrganizationRoleAsync(OrganizationRole role, CancellationToken ct = default)
        => await db.OrganizationRoles.AddAsync(role, ct);

    public void UpdateOrganizationRole(OrganizationRole role)
        => db.OrganizationRoles.Update(role);
}
