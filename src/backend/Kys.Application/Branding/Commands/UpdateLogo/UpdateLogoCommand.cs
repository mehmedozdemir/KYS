using MediatR;

namespace Kys.Application.Branding.Commands.UpdateLogo;

/// <summary>Logo yükle/güncelle. Bytes null/boş ise logo kaldırılır.</summary>
public sealed record UpdateLogoCommand(byte[]? Bytes, string? ContentType) : IRequest;
