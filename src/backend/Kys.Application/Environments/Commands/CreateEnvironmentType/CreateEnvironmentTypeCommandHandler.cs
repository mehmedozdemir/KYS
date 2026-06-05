using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.CreateEnvironmentType;

public sealed class CreateEnvironmentTypeCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateEnvironmentTypeCommand, Guid>
{
    public async Task<Guid> Handle(CreateEnvironmentTypeCommand request, CancellationToken ct)
    {
        var environmentType = new EnvironmentType
        {
            Name = request.Name,
            Code = request.Code.ToUpperInvariant(),
            Description = request.Description,
            SortOrder = request.SortOrder,
            Color = request.Color
        };

        await repository.AddEnvironmentTypeAsync(environmentType, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return environmentType.Id;
    }
}
