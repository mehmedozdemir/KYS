using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Grants.Commands.RevokeGrant;

public sealed class RevokeGrantCommandHandler(
    IAccessGrantRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<RevokeGrantCommand>
{
    public async Task Handle(RevokeGrantCommand request, CancellationToken ct)
    {
        var grant = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.AccessGrant), request.Id);

        repository.Delete(grant);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
