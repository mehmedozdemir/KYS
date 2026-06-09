using Kys.Domain.Enumerations;
using MediatR;

namespace Kys.Application.Products.Queries.GetProducts;

public sealed record GetProductsQuery(
    string? Search,
    ProductType? Type,
    ProductStatus? Status,
    int Page = 1,
    int PageSize = 20
) : IRequest<GetProductsResult>;

public sealed record GetProductsResult(IReadOnlyList<ProductListDto> Items, int TotalCount, int Page, int PageSize);

public sealed record ProductListDto(
    Guid Id,
    string Name,
    string Code,
    ProductType ProductType,
    ProductStatus Status,
    string? PoName,
    int TeamCount,
    int AssignmentCount,
    IReadOnlyList<ProductTeamBadgeDto> Teams
);

public sealed record ProductTeamBadgeDto(Guid TeamId, string TeamCode, string TeamName);
