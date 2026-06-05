namespace Kys.Domain.Entities;

public sealed class PersonSystemRole
{
    public Guid PersonId { get; set; }
    public Guid SystemRoleId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public Guid? AssignedBy { get; set; }

    // Navigation
    public Person Person { get; set; } = null!;
    public SystemRole SystemRole { get; set; } = null!;
}
