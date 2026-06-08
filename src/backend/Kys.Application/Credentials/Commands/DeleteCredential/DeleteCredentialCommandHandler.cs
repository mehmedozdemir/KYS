using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Credentials.Commands.DeleteCredential;

public sealed class DeleteCredentialCommandHandler(
    IEnvironmentRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteCredentialCommand>
{
    public async Task Handle(DeleteCredentialCommand request, CancellationToken ct)
    {
        var credential = await repository.GetCredentialByIdAsync(request.CredentialId, ct)
            ?? throw new KeyNotFoundException($"Credential {request.CredentialId} not found.");

        repository.DeleteCredential(credential);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
