using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Credentials.Commands.RevealPersonalCredential;

public sealed class RevealPersonalCredentialCommandHandler(
    IEnvironmentRepository envRepository,
    IAuditLogRepository auditLogRepository,
    IEncryptionService encryption,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<RevealPersonalCredentialCommand, string>
{
    public async Task<string> Handle(RevealPersonalCredentialCommand request, CancellationToken ct)
    {
        var credential = await envRepository.GetPersonalCredentialByIdAsync(request.CredentialId, ct)
            ?? throw new NotFoundException("PersonalCredential", request.CredentialId);

        var userId = currentUser.UserId
            ?? throw new UnauthorizedException();

        if (credential.OwnerPersonId != userId)
            throw new ForbiddenException("err.personalCredential.notOwner");

        var plainValue = encryption.DecryptWithIv(credential.EncryptedValue, credential.Iv);

        var auditLog = new AuditLog
        {
            EntityType = "PersonalCredential",
            EntityId = credential.Id,
            EntityName = credential.FieldKey,
            Action = "PersonalCredentialRevealed",
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow
        };

        await auditLogRepository.AddAsync(auditLog, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return plainValue;
    }
}
