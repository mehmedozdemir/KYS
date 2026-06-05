using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class TeamMembershipRepository(AppDbContext db) : ITeamMembershipRepository
{
    public async Task<TeamMembership?> GetActiveAsync(Guid personId, Guid teamId, CancellationToken ct = default)
        => await db.TeamMemberships
            .FirstOrDefaultAsync(tm => tm.PersonId == personId && tm.TeamId == teamId && tm.EndDate == null, ct);

    public async Task<IReadOnlyList<TeamMembership>> GetByPersonAsync(Guid personId, CancellationToken ct = default)
        => await db.TeamMemberships
            .Include(tm => tm.Team)
            .Include(tm => tm.OrganizationRole)
            .Where(tm => tm.PersonId == personId)
            .OrderByDescending(tm => tm.StartDate)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<TeamMembership>> GetByTeamAsync(Guid teamId, CancellationToken ct = default)
        => await db.TeamMemberships
            .Include(tm => tm.Person)
            .Include(tm => tm.OrganizationRole)
            .Where(tm => tm.TeamId == teamId)
            .OrderByDescending(tm => tm.StartDate)
            .ToListAsync(ct);

    public async Task AddAsync(TeamMembership membership, CancellationToken ct = default)
        => await db.TeamMemberships.AddAsync(membership, ct);

    public void Update(TeamMembership membership)
        => db.TeamMemberships.Update(membership);
}
