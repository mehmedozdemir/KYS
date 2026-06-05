using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class Person : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Title { get; set; }
    public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.Active;
    public DateOnly? HireDate { get; set; }
    public DateOnly? TerminationDate { get; set; }
    public string? TerminationReason { get; set; }

    // Platform access
    public bool IsPlatformUser { get; set; }
    public string? Username { get; set; }
    public string? PasswordHash { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsLocked { get; set; }
    public int FailedLoginCount { get; set; }

    // Custom fields (JSONB)
    public Dictionary<string, object?> CustomFields { get; set; } = [];

    // Navigation
    public ICollection<PersonSystemRole> SystemRoles { get; set; } = [];
    public ICollection<TeamMembership> TeamMemberships { get; set; } = [];

    public string FullName => $"{FirstName} {LastName}";

    public void RecordFailedLogin()
    {
        FailedLoginCount++;
        if (FailedLoginCount >= 5)
            IsLocked = true;
    }

    public void RecordSuccessfulLogin()
    {
        FailedLoginCount = 0;
        LastLoginAt = DateTime.UtcNow;
    }

    public void Terminate(DateOnly terminationDate, string? reason)
    {
        EmploymentStatus = EmploymentStatus.Terminated;
        TerminationDate = terminationDate;
        TerminationReason = reason;
        IsPlatformUser = false;
    }
}
