using MediatR;

namespace Kys.Application.Admin.Commands.UnlockAccount;

public sealed record UnlockAccountCommand(Guid PersonId) : IRequest;
