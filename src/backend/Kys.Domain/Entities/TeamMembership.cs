using Kys.Domain.Entities.Base;

namespace Kys.Domain.Entities;

public sealed class TeamMembership : AuditableEntity
{
    public Guid PersonId { get; set; }
    public Guid TeamId { get; set; }
    public Guid OrganizationRoleId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    public bool IsActive => EndDate is null;

    // Navigation
    public Person Person { get; set; } = null!;
    public Team Team { get; set; } = null!;
    public OrganizationRole OrganizationRole { get; set; } = null!;

    public void End(DateOnly endDate)
    {
        EndDate = endDate;
    }
}
