using Kys.Domain.Authorization;
using Kys.Domain.Exceptions;
using MediatR;

namespace Kys.Application.Behaviors;

/// <summary>
/// Katman B — kayıt düzeyi yazma yetkisi. <see cref="IScopedCommand"/> taşıyan komutlar
/// çalıştırılmadan önce hedef kayıt üzerinde yazma yetkisi kontrol edilir.
/// Yetenek (Katman A) zaten endpoint'te kontrol edilmiştir; bu katman "hangi kayıt"ı sınırlar.
/// </summary>
public sealed class ScopeAuthorizationBehavior<TRequest, TResponse>(IScopeService scopeService)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is IScopedCommand scoped)
        {
            var allowed = await scopeService.CanWriteAsync(scoped.ScopeTarget, cancellationToken);
            if (!allowed)
                throw new ForbiddenException("Bu kayıt üzerinde işlem yapma yetkiniz yok.");
        }

        return await next(cancellationToken);
    }
}
