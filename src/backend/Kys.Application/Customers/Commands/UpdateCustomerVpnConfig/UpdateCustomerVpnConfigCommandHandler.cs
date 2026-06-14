using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Customers.Commands.UpdateCustomerVpnConfig;

public sealed class UpdateCustomerVpnConfigCommandHandler(
    ICustomerRepository customerRepository,
    IEncryptionService encryption,
    IScopeService scope,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateCustomerVpnConfigCommand>
{
    public async Task Handle(UpdateCustomerVpnConfigCommand request, CancellationToken cancellationToken)
    {
        var config = await customerRepository.GetVpnConfigByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomerVpnConfig), request.Id);

        if (!await scope.CanWriteAsync(new ScopeTarget(ScopeKind.Customer, config.CustomerId), cancellationToken))
            throw new ForbiddenException("err.forbidden.customer");

        config.CustomerEnvironmentId = request.CustomerEnvironmentId;
        config.Name = request.Name;
        config.VpnType = request.VpnType;
        config.ServerHost = request.ServerHost;
        config.ServerPort = request.ServerPort;
        config.Username = request.Username;
        config.Notes = request.Notes;
        config.IsActive = request.IsActive;
        config.SortOrder = request.SortOrder;
        config.UpdatedAt = DateTime.UtcNow;
        config.UpdatedBy = currentUser.UserId;

        if (request.PlainPassword is not null)
        {
            if (request.PlainPassword == string.Empty)
            {
                config.EncryptedPassword = null;
                config.PasswordIv = null;
            }
            else
            {
                var (enc, iv) = encryption.EncryptWithRandomIv(request.PlainPassword);
                config.EncryptedPassword = enc;
                config.PasswordIv = iv;
            }
        }

        customerRepository.UpdateVpnConfig(config);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
