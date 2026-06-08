using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Credentials.Commands.RevealCredential;

public sealed class RevealCredentialCommandHandler(
    IEnvironmentRepository envRepository,
    IAuditLogRepository auditLogRepository,
    IEncryptionService encryption,
    ICurrentUserService currentUser,
    IResourceAuthorizationService authorizationService,
    IUnitOfWork unitOfWork) : IRequestHandler<RevealCredentialCommand, string>
{
    public async Task<string> Handle(RevealCredentialCommand request, CancellationToken ct)
    {
        var credential = await envRepository.GetCredentialByIdAsync(request.CredentialId, ct)
            ?? throw new DomainException($"Credential {request.CredentialId} not found.");

        bool canAccess = false;

        if (credential.EnvironmentResourceId.HasValue)
            canAccess = await authorizationService.CanAccessEnvironmentResourceAsync(credential.EnvironmentResourceId.Value, ct);
        else if (credential.SharedResourceId.HasValue)
            canAccess = await authorizationService.CanAccessSharedResourceAsync(credential.SharedResourceId.Value, ct);
        else if (credential.EndpointUrlId.HasValue)
            canAccess = await authorizationService.CanAccessEndpointUrlAsync(credential.EndpointUrlId.Value, ct);

        if (!canAccess)
            throw new ForbiddenException("You do not have permission to view this credential.");

        var plainValue = encryption.DecryptWithIv(credential.EncryptedValue, credential.Iv);

        var auditLog = new AuditLog
        {
            EntityType = "ResourceCredential",
            EntityId = credential.Id,
            EntityName = credential.FieldKey,
            Action = "CredentialRevealed",
            ChangedBy = currentUser.UserId,
            ChangedAt = DateTime.UtcNow
        };

        await auditLogRepository.AddAsync(auditLog, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return plainValue;
    }
}
