using MediatR;

namespace Kys.Application.Resources.Commands.UpdateResourceType;

public sealed record UpdateResourceTypeCommand(
    Guid Id,
    string Name,
    string? Category,
    string? Icon,
    string? Description,
    bool IsActive,
    Dictionary<string, object?>? FieldSchema = null) : IRequest;
