using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Kys.Application.Admin.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler(
    IPersonRepository personRepository,
    IPasswordHasher<Person> passwordHasher,
    IUnitOfWork unitOfWork
) : IRequestHandler<ResetPasswordCommand>
{
    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByIdAsync(request.PersonId, cancellationToken)
            ?? throw new NotFoundException(nameof(Person), request.PersonId);

        if (!person.IsPlatformUser)
            throw new DomainException("Person is not a platform user.");

        person.PasswordHash = passwordHasher.HashPassword(person, request.NewPassword);
        person.FailedLoginCount = 0;
        person.IsLocked = false;
        person.ClearRefreshToken();

        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
