using MediatR;

namespace Kys.Application.Email.Commands.DeleteEmailAccount;

public sealed record DeleteEmailAccountCommand(Guid Id) : IRequest;
