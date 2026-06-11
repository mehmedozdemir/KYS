using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Email.Queries.DiscoverEmailSettings;

public sealed record DiscoverEmailSettingsQuery(string Email) : IRequest<EmailDiscoveryResult>;
