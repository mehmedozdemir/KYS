using MediatR;

namespace Kys.Application.Dashboard.Queries.GetMyWorkspace;

public sealed record GetMyWorkspaceQuery(bool AllCustomers) : IRequest<IReadOnlyList<WorkspaceCustomerDto>>;
