using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Environments.Commands.DeleteEnvironmentType;

public sealed class DeleteEnvironmentTypeCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork,
    ILocalizer localizer) : IRequestHandler<DeleteEnvironmentTypeCommand>
{
    public async Task Handle(DeleteEnvironmentTypeCommand request, CancellationToken ct)
    {
        var envType = await repository.GetEnvironmentTypeByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.EnvironmentType), request.Id);

        var usageCount = await repository.CountEnvironmentsByTypeAsync(request.Id, ct);
        if (usageCount > 0)
            throw new ConflictException(localizer.Get("err.environmentType.inUse", usageCount));

        repository.DeleteEnvironmentType(envType);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
