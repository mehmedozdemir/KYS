using System.Security.Claims;
using Kys.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace Kys.Api.Authorization;

public sealed class PermissionAuthorizationHandler(IGrantService grants)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var required = requirement.Permission;

        foreach (var claim in context.User.FindAll("permission"))
        {
            var granted = claim.Value;

            // Tam yetki, birebir eşleşme veya alan wildcard ("customer:*" -> "customer:create")
            if (granted == "*" ||
                granted == required ||
                (granted.EndsWith(":*", StringComparison.Ordinal) &&
                 required.StartsWith(granted[..^1], StringComparison.Ordinal)))
            {
                context.Succeed(requirement);
                return;
            }
        }

        // Statik izin yoksa: aktif capability grant'ı kontrol et (ör. TeamLead'e atanmış customer:create)
        var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdValue, out var userId) &&
            await grants.HasCapabilityAsync(userId, required))
        {
            context.Succeed(requirement);
        }
    }
}
