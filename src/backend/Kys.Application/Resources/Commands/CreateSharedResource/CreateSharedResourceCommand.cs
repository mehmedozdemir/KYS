using MediatR;

namespace Kys.Application.Resources.Commands.CreateSharedResource;

public sealed record CreateSharedResourceCommand(
    Guid ResourceTypeId,
    string Name,
    string? Description,
    string? EnvironmentScope,
    Dictionary<string, object?> ConnectionFields) : IRequest<Guid>;
