using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.People.Commands.RemovePlatformUser;

public sealed class RemovePlatformUserCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<RemovePlatformUserCommand>
{
    public async Task Handle(RemovePlatformUserCommand request, CancellationToken ct)
    {
        var person = await personRepository.GetByIdAsync(request.PersonId, ct)
            ?? throw new NotFoundException(nameof(Person), request.PersonId);

        if (!person.IsPlatformUser)
            throw new DomainException("Bu kişi zaten platform kullanıcısı değil.");

        person.IsPlatformUser = false;
        person.Username = null;
        person.PasswordHash = null;
        person.IsLocked = false;
        person.FailedLoginCount = 0;
        person.ClearRefreshToken();

        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
