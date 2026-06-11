using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Branding.Queries.GetBranding;

public sealed class GetBrandingQueryHandler(IOrganizationProfileRepository repository)
    : IRequestHandler<GetBrandingQuery, BrandingDto>
{
    public async Task<BrandingDto> Handle(GetBrandingQuery request, CancellationToken ct)
    {
        var p = await repository.GetAsync(ct);
        return new BrandingDto(
            p.CompanyName, p.ShortName, p.Website, p.Slogan,
            p.ContactEmail, p.ContactPhone, p.Address, p.TaxNumber,
            p.LogoBytes is { Length: > 0 },
            p.LogoUpdatedAt?.Ticks ?? 0);
    }
}
