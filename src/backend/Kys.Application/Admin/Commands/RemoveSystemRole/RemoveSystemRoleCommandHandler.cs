using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Admin.Commands.RemoveSystemRole;

public sealed class RemoveSystemRoleCommandHandler(
    ISystemRoleRepository systemRoleRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<RemoveSystemRoleCommand>
{
    public async Task Handle(RemoveSystemRoleCommand request, CancellationToken cancellationToken)
    {
        var assignment = await systemRoleRepository.GetAssignmentAsync(
            request.PersonId, request.SystemRoleId, cancellationToken)
            ?? throw new NotFoundException(nameof(PersonSystemRole), $"{request.PersonId}/{request.SystemRoleId}");

        systemRoleRepository.RemoveAssignment(assignment);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
