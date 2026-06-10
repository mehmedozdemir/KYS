using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Environments.Commands.DeleteCustomerEnvironment;

public sealed record DeleteCustomerEnvironmentCommand(Guid EnvironmentId) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Environment, EnvironmentId);
}
