namespace Kys.Application.Dashboard.Queries.GetMyWorkspace;

public sealed record WorkspaceCustomerDto(
    Guid CustomerId,
    string CustomerName,
    string CustomerCode,
    IReadOnlyList<string> Products,
    IReadOnlyList<WorkspaceEnvironmentDto> Environments);

public sealed record WorkspaceEnvironmentDto(
    Guid EnvironmentId,
    string ProductName,
    string Name,
    string EnvironmentTypeName,
    string EnvironmentTypeCode,
    string? EnvironmentTypeColor,
    string? HostingPlatformName,
    string? HostingPlatformIcon,
    string? HostingPlatformColor,
    IReadOnlyList<WorkspaceEndpointDto> Endpoints,
    IReadOnlyList<WorkspaceResourceDto> Resources);

public sealed record WorkspaceEndpointDto(
    string Name,
    string EndpointType,
    string BaseUrl,
    string? SwaggerUrl,
    string? HealthCheckUrl,
    string? AuthType,
    int CredentialCount,
    IReadOnlyList<WorkspaceCredentialDto> Credentials);

public sealed record WorkspaceResourceDto(
    string TemplateName,
    string ResourceTypeName,
    string ResourceTypeCode,
    bool IsShared,
    string? SharedResourceName,
    int CredentialCount,
    IReadOnlyList<WorkspaceCredentialDto> Credentials);

public sealed record WorkspaceCredentialDto(
    Guid Id,
    string FieldKey,
    bool IsSecret);
