using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Environments.Commands.CreateHostingPlatform;

public sealed class CreateHostingPlatformCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateHostingPlatformCommand, Guid>
{
    public async Task<Guid> Handle(CreateHostingPlatformCommand request, CancellationToken ct)
    {
        var platform = new HostingPlatform
        {
            Name = request.Name,
            Code = request.Code.ToUpperInvariant(),
            Description = request.Description,
            Category = request.Category,
            Icon = request.Icon,
            Color = request.Color,
            SortOrder = request.SortOrder
        };

        await repository.AddHostingPlatformAsync(platform, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return platform.Id;
    }
}
