using Microsoft.AspNetCore.Authorization;

namespace Kys.Api.Authorization;

public sealed class RequirePermissionAttribute(string permission)
    : AuthorizeAttribute($"Permission:{permission}");
