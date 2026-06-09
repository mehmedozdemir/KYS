using MediatR;

namespace Kys.Application.Environments.Queries.GetEnvironmentDetail;

public sealed record GetEnvironmentDetailQuery(Guid EnvironmentId)
    : IRequest<EnvironmentDetailDto?>;

public sealed record EnvironmentDetailDto(
    Guid Id,
    Guid CustomerProductId,
    Guid ProductId,
    Guid CustomerId,
    string CustomerName,
    string ProductName,
    string Name,
    string EnvironmentTypeName,
    string EnvironmentTypeCode,
    string? EnvironmentTypeColor,
    bool IsActive,
    string? Notes,
    IReadOnlyList<EnvironmentResourceDto> Resources,
    IReadOnlyList<EndpointUrlDto> Endpoints,
    IReadOnlyList<AvailableResourceTemplateDto> AvailableTemplates);

public sealed record AvailableResourceTemplateDto(
    Guid Id,
    string Name,
    string ResourceTypeName,
    bool IsRequired,
    bool CanBeShared,
    Dictionary<string, object?> FieldSchema,
    Guid? SharedResourceId,
    string? SharedResourceName);

public sealed record EnvironmentResourceDto(
    Guid Id,
    string ResourceTypeName,
    string ResourceTypeCode,
    string TemplateName,
    bool IsShared,
    Guid? SharedResourceId,
    string? SharedResourceName,
    bool IsActive,
    string? Notes,
    IReadOnlyList<CredentialStubDto> Credentials,
    Dictionary<string, object?> FieldSchema,
    Dictionary<string, object?> SharedConnectionFields,
    IReadOnlyList<CredentialStubDto> SharedCredentials);

public sealed record CredentialStubDto(
    Guid Id,
    string FieldKey,
    DateTime? LastRotatedAt);

public sealed record EndpointUrlDto(
    Guid? Id,
    Guid ProductEndpointId,
    string EndpointName,
    string EndpointType,
    string? BaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    string? AuthTypeName,
    bool IsActive,
    IReadOnlyList<CredentialStubDto> Credentials);
