using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Branding.Queries.GetLogo;

public sealed class GetLogoQueryHandler(IOrganizationProfileRepository repository)
    : IRequestHandler<GetLogoQuery, LogoResult?>
{
    public async Task<LogoResult?> Handle(GetLogoQuery request, CancellationToken ct)
    {
        var p = await repository.GetAsync(ct);
        if (p.LogoBytes is not { Length: > 0 } bytes)
            return null;
        return new LogoResult(bytes, p.LogoContentType ?? "image/png");
    }
}
