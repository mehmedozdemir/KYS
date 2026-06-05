using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Customers.Queries.GetCustomerDetail;

public sealed record GetCustomerDetailQuery(Guid Id) : IRequest<CustomerDetailDto>;

public sealed record CustomerDetailDto(
    Guid Id,
    string Name,
    string Code,
    string? ShortName,
    string? Description,
    string? Sector,
    string? Country,
    string? City,
    CustomerStatus Status,
    bool IsArchived,
    DateTime? ArchivedAt,
    DateOnly? OnboardingStartedAt,
    DateOnly? TestEnvReadyAt,
    DateOnly? ProdEnvReadyAt,
    DateOnly? ProductionLiveAt,
    DateOnly? ServiceEndedAt,
    string? ChurnReason,
    string? PrimaryContactName,
    string? PrimaryContactEmail,
    string? PrimaryContactPhone,
    IReadOnlyList<CustomerProductDto> Products,
    Dictionary<string, object?> CustomFields
);

public sealed record CustomerProductDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductCode,
    UsageMode UsageMode,
    CustomerProductStatus Status,
    DateOnly? GoLiveAt
);
