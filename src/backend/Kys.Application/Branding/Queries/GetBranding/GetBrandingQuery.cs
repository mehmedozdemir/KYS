using MediatR;

namespace Kys.Application.Branding.Queries.GetBranding;

public sealed record GetBrandingQuery : IRequest<BrandingDto>;

public sealed record BrandingDto(
    string CompanyName,
    string? ShortName,
    string? Website,
    string? Slogan,
    string? ContactEmail,
    string? ContactPhone,
    string? Address,
    string? TaxNumber,
    bool HasLogo,
    long LogoVersion);
