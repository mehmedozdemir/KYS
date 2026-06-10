using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Grants.Queries.GetGrants;

public sealed record GetGrantsQuery(Guid? PersonId) : IRequest<IReadOnlyList<AccessGrantDto>>;

public sealed record AccessGrantDto(
    Guid Id,
    Guid PersonId,
    string PersonName,
    GrantKind Kind,
    GrantScopeType? ScopeType,
    Guid? ScopeId,
    GrantLevel? Level,
    string? Capability,
    DateTime GrantedAt,
    DateTime? ExpiresAt);
