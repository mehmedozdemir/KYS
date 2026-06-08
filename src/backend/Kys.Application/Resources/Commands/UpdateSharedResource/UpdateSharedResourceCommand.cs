using MediatR;

namespace Kys.Application.Resources.Commands.UpdateSharedResource;

public sealed record UpdateSharedResourceCommand(
    Guid Id,
    string Name,
    string? Description,
    string? EnvironmentScope) : IRequest;
