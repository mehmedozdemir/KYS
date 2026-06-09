using MediatR;

namespace Kys.Application.Resources.Queries.GetSharedResourceDetail;

public sealed record GetSharedResourceDetailQuery(Guid Id) : IRequest<SharedResourceDetailDto?>;

public sealed record SharedResourceDetailDto(
    Guid Id,
    string Name,
    string? Description,
    Guid ResourceTypeId,
    string ResourceTypeName,
    string ResourceTypeCode,
    string? EnvironmentScope,
    Dictionary<string, object?> ConnectionFields,
    Dictionary<string, object?> FieldSchema,
    IReadOnlyList<SharedCredentialStubDto> Credentials);

public sealed record SharedCredentialStubDto(
    Guid Id,
    string FieldKey,
    DateTime? LastRotatedAt);
