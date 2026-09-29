using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Dashboard.Queries.GetExecutiveSummary;

/// <summary>Yönetici özeti (tüm şirket görünümü; sözleşme değerleri gibi hassas toplamlar içerir).</summary>
public sealed record GetExecutiveSummaryQuery : IRequest<ExecutiveSummaryResult>;

public sealed class GetExecutiveSummaryQueryHandler(IDashboardRepository repository)
    : IRequestHandler<GetExecutiveSummaryQuery, ExecutiveSummaryResult>
{
    public Task<ExecutiveSummaryResult> Handle(GetExecutiveSummaryQuery request, CancellationToken cancellationToken)
        => repository.GetExecutiveSummaryAsync(cancellationToken);
}
