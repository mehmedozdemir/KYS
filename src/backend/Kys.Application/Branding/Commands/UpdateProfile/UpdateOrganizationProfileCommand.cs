using MediatR;

namespace Kys.Application.Branding.Commands.UpdateProfile;

public sealed record UpdateOrganizationProfileCommand(
    string CompanyName,
    string? ShortName,
    string? Website,
    string? Slogan,
    string? ContactEmail,
    string? ContactPhone,
    string? Address,
    string? TaxNumber) : IRequest;
