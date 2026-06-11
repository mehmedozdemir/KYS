using Asp.Versioning;
using Kys.Api.Authorization;
using Kys.Application.Branding.Commands.UpdateLogo;
using Kys.Application.Branding.Commands.UpdateProfile;
using Kys.Application.Branding.Queries.GetBranding;
using Kys.Application.Branding.Queries.GetLogo;
using Kys.Domain.Authorization;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Kys.Api.Controllers.v1;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/branding")]
public sealed class BrandingController(IMediator mediator) : ControllerBase
{
    // --- Public (login ekranı auth'tan önce kullanır) ---

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(BrandingDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
        => Ok(await mediator.Send(new GetBrandingQuery(), ct));

    [HttpGet("logo")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLogo(CancellationToken ct)
    {
        var logo = await mediator.Send(new GetLogoQuery(), ct);
        if (logo is null) return NotFound();
        Response.Headers.CacheControl = "public, max-age=300";
        return File(logo.Bytes, logo.ContentType);
    }

    // --- Admin (yazma) ---

    [HttpPut]
    [RequirePermission(Capabilities.AdminConfig)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Update([FromBody] UpdateBrandingRequest r, CancellationToken ct)
    {
        await mediator.Send(new UpdateOrganizationProfileCommand(
            r.CompanyName, r.ShortName, r.Website, r.Slogan,
            r.ContactEmail, r.ContactPhone, r.Address, r.TaxNumber), ct);
        return NoContent();
    }

    [HttpPost("logo")]
    [RequirePermission(Capabilities.AdminConfig)]
    [RequestSizeLimit(3 * 1024 * 1024)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UploadLogo(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { detail = "Dosya boş." });

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        await mediator.Send(new UpdateLogoCommand(ms.ToArray(), file.ContentType), ct);
        return NoContent();
    }

    [HttpDelete("logo")]
    [RequirePermission(Capabilities.AdminConfig)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveLogo(CancellationToken ct)
    {
        await mediator.Send(new UpdateLogoCommand(null, null), ct);
        return NoContent();
    }
}

public sealed record UpdateBrandingRequest(
    string CompanyName, string? ShortName, string? Website, string? Slogan,
    string? ContactEmail, string? ContactPhone, string? Address, string? TaxNumber);
