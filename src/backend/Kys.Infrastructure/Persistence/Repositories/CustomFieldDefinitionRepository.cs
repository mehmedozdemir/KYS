using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class CustomFieldDefinitionRepository(AppDbContext dbContext) : ICustomFieldDefinitionRepository
{
    public async Task<IReadOnlyList<CustomFieldDefinition>> GetByEntityTypeAsync(
        CustomFieldEntityType entityType, bool activeOnly = true, CancellationToken ct = default)
    {
        var query = dbContext.CustomFieldDefinitions
            .AsNoTracking()
            .Where(d => d.EntityType == entityType);

        if (activeOnly)
            query = query.Where(d => d.IsActive);

        return await query.OrderBy(d => d.DisplayOrder).ToListAsync(ct);
    }

    public async Task<CustomFieldDefinition?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.CustomFieldDefinitions.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<bool> ExistsAsync(CustomFieldEntityType entityType, string fieldKey, CancellationToken ct = default)
        => await dbContext.CustomFieldDefinitions
            .AnyAsync(d => d.EntityType == entityType && d.FieldKey == fieldKey, ct);

    public async Task AddAsync(CustomFieldDefinition definition, CancellationToken ct = default)
        => await dbContext.CustomFieldDefinitions.AddAsync(definition, ct);

    public void Update(CustomFieldDefinition definition)
        => dbContext.CustomFieldDefinitions.Update(definition);
}
