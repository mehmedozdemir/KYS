using MediatR;

namespace Kys.Application.CustomFields.Commands.ToggleCustomFieldDefinition;

public sealed record ToggleCustomFieldDefinitionCommand(Guid Id) : IRequest<bool>;
