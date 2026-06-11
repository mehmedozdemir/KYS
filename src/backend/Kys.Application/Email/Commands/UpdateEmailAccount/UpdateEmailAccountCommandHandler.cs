using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Email.Commands.UpdateEmailAccount;

public sealed class UpdateEmailAccountCommandHandler(
    IEmailAccountRepository repository,
    IEncryptionService encryption,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateEmailAccountCommand>
{
    public async Task Handle(UpdateEmailAccountCommand request, CancellationToken ct)
    {
        var account = await repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException(nameof(EmailAccount), request.Id);

        account.Name = request.Name;
        account.Provider = request.Provider;
        account.Host = request.Host;
        account.Port = request.Port;
        account.Security = request.Security;
        account.Username = request.Username;
        account.FromAddress = request.FromAddress;
        account.FromName = request.FromName;
        account.AcceptAllCertificates = request.AcceptAllCertificates;

        if (!string.IsNullOrWhiteSpace(request.Password))
            account.EncryptedPassword = encryption.Encrypt(request.Password);

        repository.Update(account);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
