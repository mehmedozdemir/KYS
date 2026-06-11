using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Email.Commands.DeleteEmailAccount;

public sealed class DeleteEmailAccountCommandHandler(
    IEmailAccountRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteEmailAccountCommand>
{
    public async Task Handle(DeleteEmailAccountCommand request, CancellationToken ct)
    {
        var account = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(EmailAccount), request.Id);

        repository.Delete(account);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
