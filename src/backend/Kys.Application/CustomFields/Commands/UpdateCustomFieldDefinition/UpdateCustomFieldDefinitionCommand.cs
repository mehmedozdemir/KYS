using MediatR;

namespace Kys.Application.CustomFields.Commands.UpdateCustomFieldDefinition;

public sealed record UpdateCustomFieldDefinitionCommand(
    Guid Id,
    string DisplayName,
    bool IsRequired,
    string? DefaultValue,
    List<string>? SelectOptions,
    Dictionary<string, object?>? ValidationRules,
    int DisplayOrder,
    string? GroupName
) : IRequest;
