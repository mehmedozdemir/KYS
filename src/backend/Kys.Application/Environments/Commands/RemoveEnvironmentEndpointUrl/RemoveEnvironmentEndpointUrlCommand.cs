using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Environments.Commands.RemoveEnvironmentEndpointUrl;

public sealed record RemoveEnvironmentEndpointUrlCommand(
    Guid CustomerEnvironmentId,
    Guid ProductEndpointId) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Environment, CustomerEnvironmentId);
}
