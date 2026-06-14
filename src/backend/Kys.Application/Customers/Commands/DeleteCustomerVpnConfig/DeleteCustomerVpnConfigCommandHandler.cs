using Kys.Domain.Authorization;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Customers.Commands.DeleteCustomerVpnConfig;

public sealed class DeleteCustomerVpnConfigCommandHandler(
    ICustomerRepository customerRepository,
    IScopeService scope,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<DeleteCustomerVpnConfigCommand>
{
    public async Task Handle(DeleteCustomerVpnConfigCommand request, CancellationToken cancellationToken)
    {
        var config = await customerRepository.GetVpnConfigByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomerVpnConfig), request.Id);

        if (!await scope.CanWriteAsync(new ScopeTarget(ScopeKind.Customer, config.CustomerId), cancellationToken))
            throw new ForbiddenException("err.forbidden.customer");

        var userId = currentUser.UserId;
        config.IsDeleted = true;
        config.DeletedAt = DateTime.UtcNow;
        config.DeletedBy = userId;

        customerRepository.UpdateVpnConfig(config);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
