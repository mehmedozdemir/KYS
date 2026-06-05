using Microsoft.AspNetCore.Authorization;

namespace Kys.Api.Authorization;

public sealed class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}
