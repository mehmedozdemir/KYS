using Kys.Domain.Entities;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class PersonRepository(AppDbContext db) : IPersonRepository
{
    public async Task<Person?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await db.People
            .Include(p => p.SystemRoles).ThenInclude(psr => psr.SystemRole)
            .Include(p => p.TeamMemberships).ThenInclude(tm => tm.Team)
            .Include(p => p.TeamMemberships).ThenInclude(tm => tm.OrganizationRole)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Person?> GetByUsernameAsync(string username, CancellationToken ct = default)
        => await db.People.FirstOrDefaultAsync(p => p.Username == username, ct);

    public async Task<Person?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await db.People
            .Include(p => p.SystemRoles).ThenInclude(psr => psr.SystemRole)
            .FirstOrDefaultAsync(p => p.Email == email, ct);

    public async Task<IReadOnlyList<Person>> GetAllAsync(CancellationToken ct = default)
        => await db.People.OrderBy(p => p.LastName).ThenBy(p => p.FirstName).ToListAsync(ct);

    public async Task AddAsync(Person person, CancellationToken ct = default)
        => await db.People.AddAsync(person, ct);

    public void Update(Person person)
        => db.People.Update(person);

    public async Task<bool> HasAnyPlatformUserAsync(CancellationToken ct = default)
        => await db.People.AnyAsync(p => p.IsPlatformUser, ct);
}
