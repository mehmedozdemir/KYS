using MediatR;

namespace Kys.Application.Admin.Queries.GetPersonSystemRoles;

public sealed record GetPersonSystemRolesQuery(Guid PersonId) : IRequest<IReadOnlyList<SystemRoleDto>>;

public sealed record SystemRoleDto(Guid Id, string Name, string Code, IReadOnlyList<string> Permissions, DateTime AssignedAt);
