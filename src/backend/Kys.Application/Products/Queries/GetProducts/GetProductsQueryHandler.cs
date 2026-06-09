using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Queries.GetProducts;

public sealed class GetProductsQueryHandler(IProductRepository productRepository)
    : IRequestHandler<GetProductsQuery, GetProductsResult>
{
    public async Task<GetProductsResult> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await productRepository.GetAllAsync(
            request.Search, request.Type, request.Status,
            request.Page, request.PageSize, cancellationToken);

        var dtos = items.Select(p => new ProductListDto(
            p.Id,
            p.Name,
            p.Code,
            p.ProductType,
            p.Status,
            p.PoPerson?.FullName,
            p.Teams.Count,
            p.Assignments.Count(a => a.IsActive),
            p.Teams.OrderBy(pt => pt.Team.Code)
                   .Select(pt => new ProductTeamBadgeDto(pt.TeamId, pt.Team.Code ?? pt.Team.Name, pt.Team.Name))
                   .ToList()
        )).ToList();

        return new GetProductsResult(dtos, total, request.Page, request.PageSize);
    }
}
