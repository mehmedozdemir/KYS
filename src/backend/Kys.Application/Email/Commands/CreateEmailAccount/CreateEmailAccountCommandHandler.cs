using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Email.Commands.CreateEmailAccount;

public sealed class CreateEmailAccountCommandHandler(
    IEmailAccountRepository repository,
    IEncryptionService encryption,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateEmailAccountCommand, Guid>
{
    public async Task<Guid> Handle(CreateEmailAccountCommand request, CancellationToken ct)
    {
        var account = new EmailAccount
        {
            Name = request.Name,
            Provider = request.Provider,
            Host = request.Host,
            Port = request.Port,
            Security = request.Security,
            Username = request.Username,
            EncryptedPassword = encryption.Encrypt(request.Password),
            FromAddress = request.FromAddress,
            FromName = request.FromName,
            IsActive = request.MakeActive
        };

        await repository.AddAsync(account, ct);
        if (request.MakeActive)
            await repository.DeactivateOthersAsync(account.Id, ct);

        await unitOfWork.SaveChangesAsync(ct);
        return account.Id;
    }
}
