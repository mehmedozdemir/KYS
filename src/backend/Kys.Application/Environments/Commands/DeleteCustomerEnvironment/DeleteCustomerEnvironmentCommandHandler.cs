using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Environments.Commands.DeleteCustomerEnvironment;

public sealed class DeleteCustomerEnvironmentCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork,
    ILocalizer localizer) : IRequestHandler<DeleteCustomerEnvironmentCommand>
{
    public async Task Handle(DeleteCustomerEnvironmentCommand request, CancellationToken ct)
    {
        var environment = await repository.GetEnvironmentByIdAsync(request.EnvironmentId, ct)
            ?? throw new NotFoundException("CustomerEnvironment", request.EnvironmentId);

        var resourceCount = await repository.CountResourcesByEnvironmentAsync(request.EnvironmentId, ct);
        if (resourceCount > 0)
            throw new ConflictException(localizer.Get("err.environment.hasResources", resourceCount));

        repository.RemoveCustomerEnvironment(environment);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
