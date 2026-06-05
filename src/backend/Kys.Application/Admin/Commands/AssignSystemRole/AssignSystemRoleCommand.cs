using MediatR;

namespace Kys.Application.Admin.Commands.AssignSystemRole;

public sealed record AssignSystemRoleCommand(Guid PersonId, Guid SystemRoleId) : IRequest;
