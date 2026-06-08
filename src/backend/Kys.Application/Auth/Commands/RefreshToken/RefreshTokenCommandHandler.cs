using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace Kys.Application.Auth.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler(
    IPersonRepository personRepository,
    IJwtService jwtService,
    IUnitOfWork unitOfWork,
    IConfiguration configuration
) : IRequestHandler<RefreshTokenCommand, RefreshTokenResult>
{
    public async Task<RefreshTokenResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var person = await personRepository.GetByRefreshTokenAsync(request.RefreshToken, cancellationToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (!person.IsPlatformUser)
            throw new UnauthorizedException("Account does not have platform access.");

        if (person.IsLocked)
            throw new ForbiddenException("Account is locked. Contact an administrator.");

        if (person.RefreshTokenExpiresAt is null || person.RefreshTokenExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedException("Refresh token has expired.");

        var permissions = person.SystemRoles
            .SelectMany(psr => psr.SystemRole.Permissions)
            .Distinct()
            .ToList();

        var expiryMinutes = int.TryParse(configuration["Jwt:ExpiryMinutes"], out var exp) ? exp : 60;
        var newAccessToken = jwtService.GenerateAccessToken(person, permissions);
        var newRefreshToken = jwtService.GenerateRefreshToken();

        person.SetRefreshToken(newRefreshToken, DateTime.UtcNow.AddDays(30));
        personRepository.Update(person);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new RefreshTokenResult(newAccessToken, newRefreshToken, expiryMinutes * 60);
    }
}
