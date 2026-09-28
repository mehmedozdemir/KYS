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

        var expiresAt = NormalizeExpiry(request.ExpiresAt);
        if (expiresAt is not null && expiresAt <= DateTime.UtcNow)
            throw new DomainException("err.grant.expiryInPast");

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
            ExpiresAt = expiresAt
        };

        await repository.AddAsync(grant, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return grant.Id;
    }

    // UI yalnızca tarih gönderir ("2026-12-31" → Kind=Unspecified, 00:00). PostgreSQL timestamptz
    // yalnızca UTC kabul eder; tarih-only değer o günün sonuna kadar geçerli sayılır.
    private static DateTime? NormalizeExpiry(DateTime? value)
    {
        if (value is not { } v) return null;
        var utc = v.Kind switch
        {
            DateTimeKind.Utc => v,
            DateTimeKind.Local => v.ToUniversalTime(),
            _ => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        };
        return utc.TimeOfDay == TimeSpan.Zero ? utc.Date.AddDays(1).AddTicks(-1) : utc;
    }
}
