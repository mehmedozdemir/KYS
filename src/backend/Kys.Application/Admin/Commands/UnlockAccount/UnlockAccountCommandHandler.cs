using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Admin.Commands.UnlockAccount;

public sealed class UnlockAccountCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UnlockAccountCommand>
{
    public async Task Handle(UnlockAccountCommand request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByIdAsync(request.PersonId, cancellationToken)
            ?? throw new NotFoundException(nameof(Person), request.PersonId);

        if (!person.IsLocked)
            throw new DomainException("err.account.notLocked");

        person.IsLocked = false;
        person.FailedLoginCount = 0;

        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
