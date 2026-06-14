using Kys.Application.Customers.Queries.GetCustomerVpnConfigs;
using Kys.Domain.Authorization;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Queries.GetCustomerDetail;

public sealed class GetCustomerDetailQueryHandler(ICustomerRepository customerRepository, IScopeService scope)
    : IRequestHandler<GetCustomerDetailQuery, CustomerDetailDto>
{
    public async Task<CustomerDetailDto> Handle(GetCustomerDetailQuery request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Customer), request.Id);

        if (!await scope.CanReadAsync(new ScopeTarget(ScopeKind.Customer, customer.Id), cancellationToken))
            throw new ForbiddenException("err.forbidden.customer");

        return new CustomerDetailDto(
            customer.Id, customer.Name, customer.Code, customer.ShortName,
            customer.Description, customer.Sector, customer.Country, customer.City,
            customer.Status, customer.IsArchived, customer.ArchivedAt,
            customer.OnboardingStartedAt, customer.TestEnvReadyAt,
            customer.ProdEnvReadyAt, customer.ProductionLiveAt,
            customer.ServiceEndedAt, customer.ChurnReason,
            customer.PrimaryContactName, customer.PrimaryContactEmail, customer.PrimaryContactPhone,
            customer.Products.Select(cp => new CustomerProductDto(
                cp.Id, cp.ProductId, cp.Product.Name, cp.Product.Code,
                cp.UsageMode, cp.Status, cp.GoLiveAt
            )).ToList(),
            customer.CustomFields,
            customer.VpnConfigs.Select(v => new CustomerVpnConfigDto(
                v.Id, v.CustomerId, v.CustomerEnvironmentId,
                v.CustomerEnvironment?.Name,
                v.Name, v.VpnType, v.ServerHost, v.ServerPort,
                v.Username, !string.IsNullOrEmpty(v.EncryptedPassword),
                v.Notes, v.IsActive, v.SortOrder, v.UpdatedAt
            )).ToList()
        );
    }
}
