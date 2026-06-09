using MediatR;

namespace Kys.Application.Environments.Commands.UpdateEnvironmentType;

public sealed record UpdateEnvironmentTypeCommand(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    int SortOrder,
    string? Color) : IRequest;
