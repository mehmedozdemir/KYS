using MediatR;

namespace Kys.Application.Grants.Commands.RevokeGrant;

public sealed record RevokeGrantCommand(Guid Id) : IRequest;
