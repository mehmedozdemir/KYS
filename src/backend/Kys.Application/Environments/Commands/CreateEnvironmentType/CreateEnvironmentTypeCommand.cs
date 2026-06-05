using MediatR;

namespace Kys.Application.Environments.Commands.CreateEnvironmentType;

public sealed record CreateEnvironmentTypeCommand(
    string Name,
    string Code,
    string? Description,
    int SortOrder,
    string? Color) : IRequest<Guid>;
