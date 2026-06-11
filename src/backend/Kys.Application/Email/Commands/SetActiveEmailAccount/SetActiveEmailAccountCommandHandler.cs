using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Email.Commands.SetActiveEmailAccount;

public sealed class SetActiveEmailAccountCommandHandler(
    IEmailAccountRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<SetActiveEmailAccountCommand>
{
    public async Task Handle(SetActiveEmailAccountCommand request, CancellationToken ct)
    {
        var account = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(EmailAccount), request.Id);

        account.IsActive = true;
        repository.Update(account);
        await repository.DeactivateOthersAsync(account.Id, ct);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
