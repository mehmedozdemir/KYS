using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Credentials.Queries.GetMyPersonalCredentials;

public sealed class GetMyPersonalCredentialsQueryHandler(
    IEnvironmentRepository envRepository,
    ICurrentUserService currentUser) : IRequestHandler<GetMyPersonalCredentialsQuery, IReadOnlyList<PersonalCredentialStubDto>>
{
    public async Task<IReadOnlyList<PersonalCredentialStubDto>> Handle(GetMyPersonalCredentialsQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException();

        var credentials = await envRepository.GetMyPersonalCredentialsAsync(
            userId,
            request.EnvironmentResourceId,
            request.SharedResourceId,
            ct);

        return credentials
            .Select(c => new PersonalCredentialStubDto(c.Id, c.FieldKey, c.LastRotatedAt, c.CreatedAt))
            .ToList();
    }
}
