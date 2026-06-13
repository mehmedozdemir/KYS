using MediatR;

namespace Kys.Application.Credentials.Queries.GetMyPersonalCredentials;

public sealed record GetMyPersonalCredentialsQuery(
    Guid? EnvironmentResourceId,
    Guid? SharedResourceId) : IRequest<IReadOnlyList<PersonalCredentialStubDto>>;

public sealed record PersonalCredentialStubDto(
    Guid Id,
    string FieldKey,
    DateTime? LastRotatedAt,
    DateTime CreatedAt);
