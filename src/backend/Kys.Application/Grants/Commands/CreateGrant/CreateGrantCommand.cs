using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Grants.Commands.CreateGrant;

public sealed record CreateGrantCommand(
    Guid PersonId,
    GrantKind Kind,
    GrantScopeType? ScopeType,
    Guid? ScopeId,
    GrantLevel? Level,
    string? Capability,
    DateTime? ExpiresAt) : IRequest<Guid>;
