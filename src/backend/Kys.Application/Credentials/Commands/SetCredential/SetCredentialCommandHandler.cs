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
        if (request.EnvironmentResourceId is null && request.SharedResourceId is null && request.EndpointUrlId is null)
            throw new DomainException("EnvironmentResourceId, SharedResourceId or EndpointUrlId must be provided.");

        var (encryptedValue, iv) = encryption.EncryptWithRandomIv(request.PlainValue);

        ResourceCredential? existing = null;

        if (request.EnvironmentResourceId.HasValue)
            existing = await envRepository.GetCredentialAsync(request.EnvironmentResourceId.Value, request.FieldKey, ct);
        else if (request.EndpointUrlId.HasValue)
            existing = await envRepository.GetEndpointCredentialAsync(request.EndpointUrlId.Value, request.FieldKey, ct);
        else if (request.SharedResourceId.HasValue)
            existing = await envRepository.GetSharedCredentialAsync(request.SharedResourceId.Value, request.FieldKey, ct);

        if (existing is not null)
        {
            existing.EncryptedValue = encryptedValue;
            existing.Iv = iv;
            existing.LastRotatedAt = DateTime.UtcNow;
            envRepository.UpdateCredential(existing);
            await unitOfWork.SaveChangesAsync(ct);
            return existing.Id;
        }

        var credential = new ResourceCredential
        {
            EnvironmentResourceId = request.EnvironmentResourceId,
            SharedResourceId = request.SharedResourceId,
            EndpointUrlId = request.EndpointUrlId,
            FieldKey = request.FieldKey,
            EncryptedValue = encryptedValue,
            Iv = iv
        };

        await envRepository.AddCredentialAsync(credential, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return credential.Id;
    }
}
