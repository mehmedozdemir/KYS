using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Environments.Commands.CreateCustomerEnvironment;

public sealed record CreateCustomerEnvironmentCommand(
    Guid CustomerProductId,
    Guid EnvironmentTypeId,
    string? Name,
    string? Notes,
    Guid? HostingPlatformId = null) : IRequest<Guid>, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.CustomerProduct, CustomerProductId);
}
