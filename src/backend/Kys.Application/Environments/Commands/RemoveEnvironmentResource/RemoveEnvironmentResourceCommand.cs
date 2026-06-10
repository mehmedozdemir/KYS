using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Environments.Commands.RemoveEnvironmentResource;

public sealed record RemoveEnvironmentResourceCommand(Guid ResourceId) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.EnvironmentResource, ResourceId);
}
