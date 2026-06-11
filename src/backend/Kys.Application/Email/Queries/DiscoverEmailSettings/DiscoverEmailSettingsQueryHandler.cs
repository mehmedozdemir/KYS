using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Email.Queries.DiscoverEmailSettings;

public sealed class DiscoverEmailSettingsQueryHandler(IEmailDiscoveryService discovery)
    : IRequestHandler<DiscoverEmailSettingsQuery, EmailDiscoveryResult>
{
    public Task<EmailDiscoveryResult> Handle(DiscoverEmailSettingsQuery request, CancellationToken ct)
        => discovery.DiscoverAsync(request.Email, ct);
}
