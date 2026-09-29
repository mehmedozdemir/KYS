using Kys.Domain.Authorization;
using MediatR;

namespace Kys.Application.Environments.Commands.UpdateEnvironmentResource;

/// <summary>
/// Kaynağın gizli olmayan bağlantı alanlarını (host, port, veritabanı adı...) ve notunu günceller.
/// Şifre gibi gizli alanlar credential endpoint'leri üzerinden, şifreli olarak yönetilir.
/// </summary>
public sealed record UpdateEnvironmentResourceCommand(
    Guid ResourceId,
    Dictionary<string, object?> ConnectionFields,
    string? Notes) : IRequest, IScopedCommand
{
    public ScopeTarget ScopeTarget => new(ScopeKind.EnvironmentResource, ResourceId);
}
