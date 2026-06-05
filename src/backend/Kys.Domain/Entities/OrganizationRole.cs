using Kys.Domain.Entities.Base;

namespace Kys.Domain.Entities;

public sealed class OrganizationRole : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Navigation
    public ICollection<TeamMembership> TeamMemberships { get; set; } = [];
}
