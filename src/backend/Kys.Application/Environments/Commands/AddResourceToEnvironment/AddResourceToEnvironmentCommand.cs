using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Environments.Commands.AddResourceToEnvironment;

public sealed record AddResourceToEnvironmentCommand(
    Guid CustomerEnvironmentId,
    Guid ProductResourceTemplateId,
    bool IsShared,
    Guid? SharedResourceId,
    Dictionary<string, object?> ConnectionFields,
    string? Notes) : IRequest<Guid>, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.Environment, CustomerEnvironmentId);
}
