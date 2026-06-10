using Microsoft.AspNetCore.Authorization;

namespace Kys.Api.Authorization;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var required = requirement.Permission;

        foreach (var claim in context.User.FindAll("permission"))
        {
            var granted = claim.Value;

            // Tam yetki
            if (granted == "*")
            {
                context.Succeed(requirement);
                break;
            }

            // Birebir eşleşme
            if (granted == required)
            {
                context.Succeed(requirement);
                break;
            }

            // Alan wildcard: "customer:*" -> "customer:create" vb.
            if (granted.EndsWith(":*", StringComparison.Ordinal))
            {
                var prefix = granted[..^1]; // "customer:"
                if (required.StartsWith(prefix, StringComparison.Ordinal))
                {
                    context.Succeed(requirement);
                    break;
                }
            }
        }

        return Task.CompletedTask;
    }
}
