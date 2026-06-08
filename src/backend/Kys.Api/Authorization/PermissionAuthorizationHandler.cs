using Microsoft.AspNetCore.Authorization;

namespace Kys.Api.Authorization;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // "*" wildcard grants all permissions (PlatformAdmin role)
        if (context.User.HasClaim("permission", "*") ||
            context.User.HasClaim("permission", requirement.Permission))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
