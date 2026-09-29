using MediatR;

namespace Kys.Application.Admin.Queries.GetSystemRoles;

public sealed record GetSystemRolesQuery : IRequest<IReadOnlyList<SystemRoleOptionDto>>;

public sealed record SystemRoleOptionDto(Guid Id, string Name, string Code, string? Description);
