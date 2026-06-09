using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.UpdateEnvironmentType;

public sealed class UpdateEnvironmentTypeCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateEnvironmentTypeCommand>
{
    public async Task Handle(UpdateEnvironmentTypeCommand request, CancellationToken ct)
    {
        var envType = await repository.GetEnvironmentTypeByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.EnvironmentType), request.Id);

        envType.Name = request.Name;
        envType.Code = request.Code.ToUpperInvariant();
        envType.Description = request.Description;
        envType.SortOrder = request.SortOrder;
        envType.Color = request.Color;

        repository.UpdateEnvironmentType(envType);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
