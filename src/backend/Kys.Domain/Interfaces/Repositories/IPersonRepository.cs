using Kys.Domain.Entities;

namespace Kys.Domain.Interfaces.Repositories;

public interface IPersonRepository
{
    Task<Person?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Person?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<Person?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<IReadOnlyList<Person>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(Person person, CancellationToken ct = default);
    void Update(Person person);
    Task<bool> HasAnyPlatformUserAsync(CancellationToken ct = default);
}
