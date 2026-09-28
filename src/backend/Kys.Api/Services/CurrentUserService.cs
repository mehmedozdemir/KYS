using System.Security.Claims;
using Kys.Domain.Interfaces.Services;
using Microsoft.AspNetCore.Http;

namespace Kys.Api.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var value = Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Username => Principal?.FindFirstValue(ClaimTypes.Name);

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    // Nginx/proxy arkasında gerçek istemci IP'si X-Forwarded-For'un ilk değeridir.
    public string? IpAddress
    {
        get
        {
            var ctx = httpContextAccessor.HttpContext;
            if (ctx is null) return null;
            var forwarded = ctx.Request.Headers["X-Forwarded-For"].ToString();
            if (!string.IsNullOrWhiteSpace(forwarded))
                return forwarded.Split(',')[0].Trim();
            return ctx.Connection.RemoteIpAddress?.ToString();
        }
    }

    public bool HasPermission(string permission)
        => Principal?.HasClaim("permission", "*") == true ||
           Principal?.HasClaim("permission", permission) == true;
}
