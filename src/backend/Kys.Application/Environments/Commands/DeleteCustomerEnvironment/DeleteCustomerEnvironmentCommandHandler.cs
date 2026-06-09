using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.DeleteCustomerEnvironment;

public sealed class DeleteCustomerEnvironmentCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteCustomerEnvironmentCommand>
{
    public async Task Handle(DeleteCustomerEnvironmentCommand request, CancellationToken ct)
    {
        var environment = await repository.GetEnvironmentByIdAsync(request.EnvironmentId, ct)
            ?? throw new NotFoundException("CustomerEnvironment", request.EnvironmentId);

        var resourceCount = await repository.CountResourcesByEnvironmentAsync(request.EnvironmentId, ct);
        if (resourceCount > 0)
            throw new ConflictException(
                $"Bu ortamda {resourceCount} kaynak bulunmaktadır. Önce kaynakları kaldırın.");

        repository.RemoveCustomerEnvironment(environment);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
