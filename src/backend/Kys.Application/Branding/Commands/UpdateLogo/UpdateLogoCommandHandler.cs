using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Branding.Commands.UpdateLogo;

public sealed class UpdateLogoCommandHandler(
    IOrganizationProfileRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateLogoCommand>
{
    private static readonly string[] Allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];

    public async Task Handle(UpdateLogoCommand request, CancellationToken ct)
    {
        var p = await repository.GetAsync(ct);

        if (request.Bytes is { Length: > 0 } bytes)
        {
            if (bytes.Length > 2 * 1024 * 1024)
                throw new DomainException("Logo en fazla 2 MB olabilir.");
            if (request.ContentType is null || !Allowed.Contains(request.ContentType))
                throw new DomainException("Desteklenmeyen dosya türü. PNG, JPEG, SVG, WEBP veya GIF yükleyin.");

            p.LogoBytes = bytes;
            p.LogoContentType = request.ContentType;
            p.LogoUpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Logoyu kaldır
            p.LogoBytes = null;
            p.LogoContentType = null;
            p.LogoUpdatedAt = DateTime.UtcNow;
        }

        repository.Update(p);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
