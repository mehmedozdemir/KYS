using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Credentials.Commands.SetPersonalCredential;

public sealed class SetPersonalCredentialCommandHandler(
    IEnvironmentRepository envRepository,
    IEncryptionService encryption,
    IResourceAuthorizationService authorization,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<SetPersonalCredentialCommand, Guid>
{
    public async Task<Guid> Handle(SetPersonalCredentialCommand request, CancellationToken ct)
    {
        if (request.EnvironmentResourceId is null && request.SharedResourceId is null)
            throw new DomainException("err.personalCredential.targetRequired");

        // Katman B — kaynağın sahiplik kapsamı kontrolü
        var canAccess =
            request.EnvironmentResourceId.HasValue
                ? await authorization.CanAccessEnvironmentResourceAsync(request.EnvironmentResourceId.Value, ct)
                : await authorization.CanAccessSharedResourceAsync(request.SharedResourceId!.Value, ct);

        if (!canAccess)
            throw new ForbiddenException("err.credential.forbiddenEdit");

        var ownerPersonId = currentUser.UserId
            ?? throw new UnauthorizedException();

        var (encryptedValue, iv) = encryption.EncryptWithRandomIv(request.PlainValue);

        var existing = await envRepository.GetPersonalCredentialAsync(
            ownerPersonId,
            request.EnvironmentResourceId,
            request.SharedResourceId,
            request.FieldKey,
            ct);

        if (existing is not null)
        {
            existing.EncryptedValue = encryptedValue;
            existing.Iv = iv;
            existing.LastRotatedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = ownerPersonId;
            envRepository.UpdatePersonalCredential(existing);
            await unitOfWork.SaveChangesAsync(ct);
            return existing.Id;
        }

        var credential = new PersonalCredential
        {
            EnvironmentResourceId = request.EnvironmentResourceId,
            SharedResourceId = request.SharedResourceId,
            OwnerPersonId = ownerPersonId,
            FieldKey = request.FieldKey,
            EncryptedValue = encryptedValue,
            Iv = iv,
            CreatedBy = ownerPersonId,
            UpdatedBy = ownerPersonId
        };

        await envRepository.AddPersonalCredentialAsync(credential, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return credential.Id;
    }
}
