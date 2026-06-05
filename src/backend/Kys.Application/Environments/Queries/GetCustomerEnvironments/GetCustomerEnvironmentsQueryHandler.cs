using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Queries.GetCustomerEnvironments;

public sealed class GetCustomerEnvironmentsQueryHandler(IEnvironmentRepository repository)
    : IRequestHandler<GetCustomerEnvironmentsQuery, IReadOnlyList<CustomerEnvironmentSummaryDto>>
{
    public async Task<IReadOnlyList<CustomerEnvironmentSummaryDto>> Handle(GetCustomerEnvironmentsQuery request, CancellationToken ct)
    {
        var envs = await repository.GetByCustomerProductAsync(request.CustomerProductId, ct);
        return envs.Select(e => new CustomerEnvironmentSummaryDto(
            e.Id,
            e.Name,
            e.EnvironmentType.Name,
            e.EnvironmentType.Code,
            e.EnvironmentType.Color,
            e.IsActive,
            e.Resources.Count,
            e.Endpoints.Count,
            e.Notes)).ToList();
    }
}
