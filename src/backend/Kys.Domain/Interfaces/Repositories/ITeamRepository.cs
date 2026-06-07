using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface ITeamRepository
{
    Task<Team?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Team>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(Team team, CancellationToken ct = default);
    void Update(Team team);
    Task<IReadOnlyList<OrganizationRole>> GetOrganizationRolesAsync(CancellationToken ct = default);
}
