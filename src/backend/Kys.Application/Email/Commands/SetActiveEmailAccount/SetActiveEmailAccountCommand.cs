using MediatR;

namespace Kys.Application.Email.Commands.SetActiveEmailAccount;

public sealed record SetActiveEmailAccountCommand(Guid Id) : IRequest;
