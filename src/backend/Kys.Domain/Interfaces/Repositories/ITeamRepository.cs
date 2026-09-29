using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface ITeamRepository
{
    Task<Team?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Team>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(Team team, CancellationToken ct = default);
    void Update(Team team);
    Task<IReadOnlyList<OrganizationRole>> GetOrganizationRolesAsync(CancellationToken ct = default);
    Task<OrganizationRole?> GetOrganizationRoleByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> OrganizationRoleNameExistsAsync(string name, Guid? excludeId, CancellationToken ct = default);
    Task<int> CountActiveMembershipsForRoleAsync(Guid roleId, CancellationToken ct = default);
    Task AddOrganizationRoleAsync(OrganizationRole role, CancellationToken ct = default);
    void UpdateOrganizationRole(OrganizationRole role);
}
