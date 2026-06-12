using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Credentials.Commands.DeleteCredential;

public sealed class DeleteCredentialCommandHandler(
    IEnvironmentRepository repository,
    IResourceAuthorizationService authorization,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteCredentialCommand>
{
    public async Task Handle(DeleteCredentialCommand request, CancellationToken ct)
    {
        var credential = await repository.GetCredentialByIdAsync(request.CredentialId, ct)
            ?? throw new KeyNotFoundException($"Credential {request.CredentialId} not found.");

        // Katman B — kaynağın sahiplik kapsamı kontrolü
        var canWrite =
            credential.EnvironmentResourceId.HasValue ? await authorization.CanAccessEnvironmentResourceAsync(credential.EnvironmentResourceId.Value, ct) :
            credential.EndpointUrlId.HasValue ? await authorization.CanAccessEndpointUrlAsync(credential.EndpointUrlId.Value, ct) :
            credential.SharedResourceId.HasValue && await authorization.CanAccessSharedResourceAsync(credential.SharedResourceId.Value, ct);
        if (!canWrite)
            throw new ForbiddenException("err.credential.forbiddenDelete");

        repository.DeleteCredential(credential);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
