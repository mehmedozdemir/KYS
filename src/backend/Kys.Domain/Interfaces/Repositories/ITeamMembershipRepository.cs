using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface ITeamMembershipRepository
{
    Task<TeamMembership?> GetActiveAsync(Guid personId, Guid teamId, CancellationToken ct = default);
    Task<IReadOnlyList<TeamMembership>> GetByPersonAsync(Guid personId, CancellationToken ct = default);
    Task<IReadOnlyList<TeamMembership>> GetByTeamAsync(Guid teamId, CancellationToken ct = default);
    Task AddAsync(TeamMembership membership, CancellationToken ct = default);
    void Update(TeamMembership membership);
}
