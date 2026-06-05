namespace Kys.Domain.Interfaces.Services;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Username { get; }
    bool IsAuthenticated { get; }
    bool HasPermission(string permission);
}
