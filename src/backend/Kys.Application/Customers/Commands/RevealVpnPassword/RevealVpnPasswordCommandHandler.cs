using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Customers.Commands.RevealVpnPassword;

public sealed class RevealVpnPasswordCommandHandler(
    ICustomerRepository customerRepository,
    IAuditLogRepository auditLogRepository,
    IEncryptionService encryption,
    IScopeService scope,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<RevealVpnPasswordCommand, string>
{
    public async Task<string> Handle(RevealVpnPasswordCommand request, CancellationToken cancellationToken)
    {
        var config = await customerRepository.GetVpnConfigByIdAsync(request.VpnConfigId, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomerVpnConfig), request.VpnConfigId);

        if (!await scope.CanReadAsync(new ScopeTarget(ScopeKind.Customer, config.CustomerId), cancellationToken))
            throw new ForbiddenException("err.vpnConfig.forbiddenReveal");

        if (string.IsNullOrEmpty(config.EncryptedPassword) || string.IsNullOrEmpty(config.PasswordIv))
            throw new DomainException("err.vpnConfig.noPassword");

        var userId = currentUser.UserId;

        var plainPassword = encryption.DecryptWithIv(config.EncryptedPassword, config.PasswordIv);

        var auditLog = new AuditLog
        {
            EntityType = "CustomerVpnConfig",
            EntityId = config.Id,
            EntityName = config.Name,
            Action = "VpnPasswordRevealed",
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow
        };

        await auditLogRepository.AddAsync(auditLog, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return plainPassword;
    }
}
