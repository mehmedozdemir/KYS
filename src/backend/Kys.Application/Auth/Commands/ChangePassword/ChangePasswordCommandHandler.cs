using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Kys.Application.Auth.Commands.ChangePassword;

public sealed class ChangePasswordCommandHandler(
    IPersonRepository personRepository,
    ICurrentUserService currentUser,
    IPasswordHasher<Person> passwordHasher,
    IUnitOfWork unitOfWork
) : IRequestHandler<ChangePasswordCommand>
{
    public async Task Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var personId = currentUser.UserId
            ?? throw new ForbiddenException("Oturum bulunamadı.");

        var person = await personRepository.GetByIdAsync(personId, cancellationToken)
            ?? throw new NotFoundException(nameof(Person), personId);

        if (!person.IsPlatformUser || person.PasswordHash is null)
            throw new DomainException("Bu hesabın şifresi değiştirilemez.");

        var result = passwordHasher.VerifyHashedPassword(person, person.PasswordHash, request.CurrentPassword);
        if (result == PasswordVerificationResult.Failed)
            throw new ForbiddenException("Mevcut şifre hatalı.");

        person.PasswordHash = passwordHasher.HashPassword(person, request.NewPassword);
        person.ClearRefreshToken();

        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
