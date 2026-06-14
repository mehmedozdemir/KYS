using Kys.Domain.Authorization;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Customers.Queries.GetCustomerVpnConfigs;

public sealed class GetCustomerVpnConfigsQueryHandler(
    ICustomerRepository customerRepository,
    IScopeService scope) : IRequestHandler<GetCustomerVpnConfigsQuery, IReadOnlyList<CustomerVpnConfigDto>>
{
    public async Task<IReadOnlyList<CustomerVpnConfigDto>> Handle(
        GetCustomerVpnConfigsQuery request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.CustomerId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Customer), request.CustomerId);

        if (!await scope.CanReadAsync(new ScopeTarget(ScopeKind.Customer, customer.Id), cancellationToken))
            throw new ForbiddenException("err.forbidden.customer");

        var configs = await customerRepository.GetVpnConfigsAsync(request.CustomerId, cancellationToken);

        return configs.Select(c => new CustomerVpnConfigDto(
            c.Id,
            c.CustomerId,
            c.CustomerEnvironmentId,
            c.CustomerEnvironment?.Name,
            c.Name,
            c.VpnType,
            c.ServerHost,
            c.ServerPort,
            c.Username,
            !string.IsNullOrEmpty(c.EncryptedPassword),
            c.Notes,
            c.IsActive,
            c.SortOrder,
            c.UpdatedAt
        )).ToList();
    }
}
