using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.CustomFields.Commands.CreateCustomFieldDefinition;

public sealed record CreateCustomFieldDefinitionCommand(
    CustomFieldEntityType EntityType,
    string FieldKey,
    string DisplayName,
    CustomFieldType FieldType,
    bool IsRequired,
    string? DefaultValue,
    List<string>? SelectOptions,
    Dictionary<string, object?>? ValidationRules,
    int DisplayOrder,
    string? GroupName
) : IRequest<Guid>;
