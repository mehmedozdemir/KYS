using MediatR;

namespace Kys.Application.Environments.Queries.GetEnvironmentDetail;

public sealed record GetEnvironmentDetailQuery(Guid EnvironmentId)
    : IRequest<EnvironmentDetailDto?>;

public sealed record EnvironmentDetailDto(
    Guid Id,
    Guid CustomerProductId,
    string Name,
    string EnvironmentTypeName,
    string EnvironmentTypeCode,
    string? EnvironmentTypeColor,
    bool IsActive,
    string? Notes,
    IReadOnlyList<EnvironmentResourceDto> Resources,
    IReadOnlyList<EndpointUrlDto> Endpoints);

public sealed record EnvironmentResourceDto(
    Guid Id,
    string ResourceTypeName,
    string ResourceTypeCode,
    string TemplateName,
    bool IsShared,
    Guid? SharedResourceId,
    string? SharedResourceName,
    bool IsActive,
    string? Notes);

public sealed record EndpointUrlDto(
    Guid Id,
    string EndpointName,
    string EndpointType,
    string BaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    bool IsActive);
