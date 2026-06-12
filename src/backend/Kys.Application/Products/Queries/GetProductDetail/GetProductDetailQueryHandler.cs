using Kys.Domain.Authorization;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Products.Queries.GetProductDetail;

public sealed class GetProductDetailQueryHandler(IProductRepository productRepository, IScopeService scope)
    : IRequestHandler<GetProductDetailQuery, ProductDetailDto>
{
    public async Task<ProductDetailDto> Handle(GetProductDetailQuery request, CancellationToken cancellationToken)
    {
        var product = await productRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Product), request.Id);

        if (!await scope.CanReadAsync(new ScopeTarget(ScopeKind.Product, product.Id), cancellationToken))
            throw new ForbiddenException("err.forbidden.product");

        return new ProductDetailDto(
            product.Id,
            product.Name,
            product.Code,
            product.Description,
            product.Version,
            product.ProductType,
            product.Status,
            product.PoPersonId,
            product.PoPerson?.FullName,
            product.TechStack.AsReadOnly(),
            product.RepositoryUrl,
            product.DocumentationUrl,
            product.Teams.Select(t => new ProductTeamDto(t.TeamId, t.Team.Name, t.Role, t.Since)).ToList(),
            product.Assignments.Select(a => new ProductAssignmentDto(a.PersonId, a.Person.FullName, a.Responsibility, a.StartedAt, a.IsActive)).ToList(),
            product.Endpoints.OrderBy(e => e.SortOrder).Select(e => new ProductEndpointDto(e.Id, e.Name, e.EndpointType, e.DefaultBaseUrl, e.SwaggerUrl, e.SortOrder)).ToList(),
            product.ResourceTemplates.OrderBy(rt => rt.SortOrder).Select(rt => new ProductResourceTemplateDto(rt.Id, rt.Name, rt.ResourceTypeId, rt.ResourceType.Name, rt.IsRequired, rt.CanBeShared, rt.SortOrder, rt.SharedResourceId, rt.SharedResource?.Name)).ToList(),
            product.CustomFields
        );
    }
}
