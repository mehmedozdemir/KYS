using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Services;

public interface IJwtService
{
    string GenerateAccessToken(Person person, IEnumerable<string> permissions);
    string GenerateRefreshToken();
}
