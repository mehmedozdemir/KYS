using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Kys.Application.People.Commands.MakePlatformUser;

public sealed class MakePlatformUserCommandHandler(
    IPersonRepository personRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher<Person> passwordHasher,
    IAccountEmailService accountEmail
) : IRequestHandler<MakePlatformUserCommand>
{
    public async Task Handle(MakePlatformUserCommand request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByIdAsync(request.PersonId, cancellationToken)
            ?? throw new NotFoundException(nameof(Person), request.PersonId);

        if (person.IsPlatformUser)
            throw new DomainException("Bu kişi zaten platform kullanıcısı.");

        if (string.IsNullOrWhiteSpace(person.Email))
            throw new DomainException("Platform kullanıcısı için kişinin e-posta adresi olmalıdır.");

        person.IsPlatformUser = true;
        person.Username = person.Email;
        person.PasswordHash = passwordHasher.HashPassword(person, request.Password);

        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await accountEmail.SendPlatformWelcomeAsync(
            person.Email, $"{person.FirstName} {person.LastName}", person.Email, request.Password, cancellationToken);
    }
}
