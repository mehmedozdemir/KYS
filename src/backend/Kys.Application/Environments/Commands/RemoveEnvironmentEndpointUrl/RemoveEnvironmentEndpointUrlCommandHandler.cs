using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.RemoveEnvironmentEndpointUrl;

public sealed class RemoveEnvironmentEndpointUrlCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<RemoveEnvironmentEndpointUrlCommand>
{
    public async Task Handle(RemoveEnvironmentEndpointUrlCommand request, CancellationToken ct)
    {
        var endpoint = await repository.GetEndpointAsync(request.CustomerEnvironmentId, request.ProductEndpointId, ct)
            ?? throw new NotFoundException("CustomerEnvironmentEndpoint", request.ProductEndpointId);

        repository.RemoveEndpointUrl(endpoint);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
