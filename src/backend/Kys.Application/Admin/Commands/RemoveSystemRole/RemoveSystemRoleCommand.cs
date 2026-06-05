using MediatR;

namespace Kys.Application.Admin.Commands.RemoveSystemRole;

public sealed record RemoveSystemRoleCommand(Guid PersonId, Guid SystemRoleId) : IRequest;
