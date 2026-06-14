using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Customers.Commands.CreateCustomerVpnConfig;

public sealed class CreateCustomerVpnConfigCommandHandler(
    ICustomerRepository customerRepository,
    IEncryptionService encryption,
    IScopeService scope,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateCustomerVpnConfigCommand, Guid>
{
    public async Task<Guid> Handle(CreateCustomerVpnConfigCommand request, CancellationToken cancellationToken)
    {
        var customer = await customerRepository.GetByIdAsync(request.CustomerId, cancellationToken)
            ?? throw new NotFoundException(nameof(Customer), request.CustomerId);

        if (!await scope.CanWriteAsync(new ScopeTarget(ScopeKind.Customer, customer.Id), cancellationToken))
            throw new ForbiddenException("err.forbidden.customer");

        string? encryptedPassword = null;
        string? passwordIv = null;

        if (!string.IsNullOrEmpty(request.PlainPassword))
        {
            var (enc, iv) = encryption.EncryptWithRandomIv(request.PlainPassword);
            encryptedPassword = enc;
            passwordIv = iv;
        }

        var userId = currentUser.UserId;

        var config = new CustomerVpnConfig
        {
            CustomerId = request.CustomerId,
            CustomerEnvironmentId = request.CustomerEnvironmentId,
            Name = request.Name,
            VpnType = request.VpnType,
            ServerHost = request.ServerHost,
            ServerPort = request.ServerPort,
            Username = request.Username,
            EncryptedPassword = encryptedPassword,
            PasswordIv = passwordIv,
            Notes = request.Notes,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        await customerRepository.AddVpnConfigAsync(config, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return config.Id;
    }
}
