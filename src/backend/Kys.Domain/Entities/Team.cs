using Kys.Domain.Entities.Base;

namespace Kys.Domain.Entities;

public sealed class Team : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public string TeamType { get; set; } = "Project"; // Domain | Project | Platform

    // Navigation
    public ICollection<TeamMembership> Memberships { get; set; } = [];
}
