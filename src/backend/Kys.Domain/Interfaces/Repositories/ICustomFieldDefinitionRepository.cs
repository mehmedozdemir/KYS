using Kys.Domain.Entities;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Interfaces.Repositories;

public interface ICustomFieldDefinitionRepository
{
    Task<IReadOnlyList<CustomFieldDefinition>> GetByEntityTypeAsync(CustomFieldEntityType entityType, bool activeOnly = true, CancellationToken ct = default);
    Task<CustomFieldDefinition?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsAsync(CustomFieldEntityType entityType, string fieldKey, CancellationToken ct = default);
    Task AddAsync(CustomFieldDefinition definition, CancellationToken ct = default);
    void Update(CustomFieldDefinition definition);
}
