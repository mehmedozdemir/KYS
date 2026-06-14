using Kys.Domain.Authorization;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Credentials.Commands.DeletePersonalCredential;

public sealed class DeletePersonalCredentialCommandHandler(
    IEnvironmentRepository repository,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<DeletePersonalCredentialCommand>
{
    public async Task Handle(DeletePersonalCredentialCommand request, CancellationToken ct)
    {
        var credential = await repository.GetPersonalCredentialByIdAsync(request.CredentialId, ct)
            ?? throw new NotFoundException("PersonalCredential", request.CredentialId);

        var userId = currentUser.UserId
            ?? throw new UnauthorizedException();

        var isOwner = credential.OwnerPersonId == userId;
        var hasManageCapability = currentUser.HasPermission(Capabilities.PersonalCredentialManage);

        if (!isOwner && !hasManageCapability)
            throw new ForbiddenException("err.personalCredential.forbiddenDelete");

        credential.IsDeleted = true;
        credential.DeletedAt = DateTime.UtcNow;
        credential.DeletedBy = userId;

        repository.UpdatePersonalCredential(credential);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
