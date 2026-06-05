using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.CustomFields.Queries.GetCustomFieldDefinitions;

public sealed record GetCustomFieldDefinitionsQuery(
    CustomFieldEntityType EntityType,
    bool ActiveOnly = true
) : IRequest<IReadOnlyList<CustomFieldDefinitionDto>>;

public sealed record CustomFieldDefinitionDto(
    Guid Id,
    CustomFieldEntityType EntityType,
    string FieldKey,
    string DisplayName,
    CustomFieldType FieldType,
    bool IsRequired,
    string? DefaultValue,
    IReadOnlyList<string>? SelectOptions,
    Dictionary<string, object?> ValidationRules,
    int DisplayOrder,
    string? GroupName,
    bool IsActive
);
