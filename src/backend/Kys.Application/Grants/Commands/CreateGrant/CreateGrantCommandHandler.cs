using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Grants.Commands.CreateGrant;

public sealed class CreateGrantCommandHandler(
    IAccessGrantRepository repository,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateGrantCommand, Guid>
{
    public async Task<Guid> Handle(CreateGrantCommand request, CancellationToken ct)
    {
        if (request.Kind == GrantKind.Scope)
        {
            if (request.ScopeType is null || request.ScopeId is null || request.Level is null)
                throw new DomainException("err.grant.scopeFieldsRequired");
        }
        else if (string.IsNullOrWhiteSpace(request.Capability))
        {
            throw new DomainException("err.grant.capabilityRequired");
        }

        var grant = new AccessGrant
        {
            PersonId = request.PersonId,
            Kind = request.Kind,
            ScopeType = request.Kind == GrantKind.Scope ? request.ScopeType : null,
            ScopeId = request.Kind == GrantKind.Scope ? request.ScopeId : null,
            Level = request.Kind == GrantKind.Scope ? request.Level : null,
            Capability = request.Kind == GrantKind.Capability ? request.Capability!.Trim() : null,
            GrantedBy = currentUser.UserId ?? Guid.Empty,
            GrantedAt = DateTime.UtcNow,
            ExpiresAt = request.ExpiresAt
        };

        await repository.AddAsync(grant, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return grant.Id;
    }
}
