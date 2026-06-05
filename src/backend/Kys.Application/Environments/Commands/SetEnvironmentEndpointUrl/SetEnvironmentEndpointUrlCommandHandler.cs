using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.SetEnvironmentEndpointUrl;

public sealed class SetEnvironmentEndpointUrlCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<SetEnvironmentEndpointUrlCommand, Guid>
{
    public async Task<Guid> Handle(SetEnvironmentEndpointUrlCommand request, CancellationToken ct)
    {
        var existing = await repository.GetEndpointAsync(request.CustomerEnvironmentId, request.ProductEndpointId, ct);

        if (existing is not null)
        {
            existing.BaseUrl = request.BaseUrl;
            existing.SwaggerUrl = request.SwaggerUrl;
            existing.HealthCheckUrl = request.HealthCheckUrl;
            existing.AuthType = request.AuthType;
            existing.AuthConfig = request.AuthConfig;
            existing.Notes = request.Notes;
            repository.UpdateEndpointUrl(existing);
            await unitOfWork.SaveChangesAsync(ct);
            return existing.Id;
        }

        var endpoint = new CustomerEnvironmentEndpoint
        {
            CustomerEnvironmentId = request.CustomerEnvironmentId,
            ProductEndpointId = request.ProductEndpointId,
            BaseUrl = request.BaseUrl,
            SwaggerUrl = request.SwaggerUrl,
            HealthCheckUrl = request.HealthCheckUrl,
            AuthType = request.AuthType,
            AuthConfig = request.AuthConfig,
            Notes = request.Notes
        };

        await repository.AddEndpointUrlAsync(endpoint, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return endpoint.Id;
    }
}
