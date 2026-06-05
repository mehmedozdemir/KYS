using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Admin.Commands.AssignSystemRole;

public sealed class AssignSystemRoleCommandHandler(
    IPersonRepository personRepository,
    ISystemRoleRepository systemRoleRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<AssignSystemRoleCommand>
{
    public async Task Handle(AssignSystemRoleCommand request, CancellationToken cancellationToken)
    {
        _ = await personRepository.GetByIdAsync(request.PersonId, cancellationToken)
            ?? throw new NotFoundException(nameof(Person), request.PersonId);

        var role = await systemRoleRepository.GetByIdAsync(request.SystemRoleId, cancellationToken)
            ?? throw new NotFoundException(nameof(SystemRole), request.SystemRoleId);

        var existing = await systemRoleRepository.GetAssignmentAsync(
            request.PersonId, request.SystemRoleId, cancellationToken);

        if (existing is not null)
            throw new DomainException($"Person already has role '{role.Code}'.");

        var assignment = new PersonSystemRole
        {
            PersonId = request.PersonId,
            SystemRoleId = request.SystemRoleId,
            AssignedAt = DateTime.UtcNow
        };

        await systemRoleRepository.AssignToPersonAsync(assignment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
