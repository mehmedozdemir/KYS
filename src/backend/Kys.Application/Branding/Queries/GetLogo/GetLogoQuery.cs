using MediatR;

namespace Kys.Application.Branding.Queries.GetLogo;

public sealed record GetLogoQuery : IRequest<LogoResult?>;

public sealed record LogoResult(byte[] Bytes, string ContentType);
