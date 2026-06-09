using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.UpdateHostingPlatform;

public sealed class UpdateHostingPlatformCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateHostingPlatformCommand>
{
    public async Task Handle(UpdateHostingPlatformCommand request, CancellationToken ct)
    {
        var platform = await repository.GetHostingPlatformByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.HostingPlatform), request.Id);

        platform.Name = request.Name;
        platform.Code = request.Code.ToUpperInvariant();
        platform.Description = request.Description;
        platform.Category = request.Category;
        platform.Icon = request.Icon;
        platform.Color = request.Color;
        platform.SortOrder = request.SortOrder;
        platform.IsActive = request.IsActive;

        repository.UpdateHostingPlatform(platform);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
