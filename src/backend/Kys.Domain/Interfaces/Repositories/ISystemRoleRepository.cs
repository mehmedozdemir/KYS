using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface ISystemRoleRepository
{
    Task<IReadOnlyList<SystemRole>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SystemRole?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PersonSystemRole>> GetByPersonAsync(Guid personId, CancellationToken cancellationToken = default);
    Task AssignToPersonAsync(PersonSystemRole assignment, CancellationToken cancellationToken = default);
    Task<PersonSystemRole?> GetAssignmentAsync(Guid personId, Guid systemRoleId, CancellationToken cancellationToken = default);
    void RemoveAssignment(PersonSystemRole assignment);
}
