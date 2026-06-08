using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace Kys.Application.Auth.Commands.Login;

public sealed class LoginCommandHandler(
    IPersonRepository personRepository,
    IPasswordHasher<Person> passwordHasher,
    IJwtService jwtService,
    IUnitOfWork unitOfWork,
    IConfiguration configuration
) : IRequestHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByEmailAsync(request.Email, cancellationToken)
            ?? throw new ForbiddenException("Invalid credentials.");

        if (!person.IsPlatformUser)
            throw new ForbiddenException("Account does not have platform access.");

        if (person.IsLocked)
            throw new ForbiddenException("Account is locked. Contact an administrator.");

        if (person.PasswordHash is null)
            throw new ForbiddenException("Invalid credentials.");

        var result = passwordHasher.VerifyHashedPassword(person, person.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            person.RecordFailedLogin();
            personRepository.Update(person);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            throw new ForbiddenException("Invalid credentials.");
        }

        person.RecordSuccessfulLogin();

        var permissions = person.SystemRoles
            .SelectMany(psr => psr.SystemRole.Permissions)
            .Distinct()
            .ToList();

        var expiryMinutes = int.TryParse(configuration["Jwt:ExpiryMinutes"], out var exp) ? exp : 60;
        var accessToken = jwtService.GenerateAccessToken(person, permissions);
        var refreshToken = jwtService.GenerateRefreshToken();

        person.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));
        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResult(accessToken, refreshToken, expiryMinutes * 60, person.Id, person.FullName, permissions.AsReadOnly());
    }
}
