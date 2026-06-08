using MediatR;

namespace Kys.Application.Resources.Commands.CreateResourceType;

public sealed record CreateResourceTypeCommand(
    string Name,
    string Code,
    string? Category,
    string? Icon,
    string? Description,
    Dictionary<string, object?>? FieldSchema) : IRequest<Guid>;
