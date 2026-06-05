using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Credentials.Commands.SetCredential;

public sealed class SetCredentialCommandHandler(
    IEnvironmentRepository envRepository,
    IEncryptionService encryption,
    IUnitOfWork unitOfWork) : IRequestHandler<SetCredentialCommand, Guid>
{
    public async Task<Guid> Handle(SetCredentialCommand request, CancellationToken ct)
    {
        if (request.EnvironmentResourceId is null && request.SharedResourceId is null)
            throw new DomainException("Either EnvironmentResourceId or SharedResourceId must be provided.");

        var (encryptedValue, iv) = encryption.EncryptWithRandomIv(request.PlainValue);

        if (request.EnvironmentResourceId.HasValue)
        {
            var existing = await envRepository.GetCredentialAsync(request.EnvironmentResourceId.Value, request.FieldKey, ct);

            if (existing is not null)
            {
                existing.EncryptedValue = encryptedValue;
                existing.Iv = iv;
                existing.LastRotatedAt = DateTime.UtcNow;
                envRepository.UpdateCredential(existing);
                await unitOfWork.SaveChangesAsync(ct);
                return existing.Id;
            }
        }

        var credential = new ResourceCredential
        {
            EnvironmentResourceId = request.EnvironmentResourceId,
            SharedResourceId = request.SharedResourceId,
            FieldKey = request.FieldKey,
            EncryptedValue = encryptedValue,
            Iv = iv
        };

        await envRepository.AddCredentialAsync(credential, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return credential.Id;
    }
}
