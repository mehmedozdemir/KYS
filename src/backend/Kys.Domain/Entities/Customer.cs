using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class Customer : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public string? Description { get; set; }
    public string? Sector { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }

    public CustomerStatus Status { get; set; } = CustomerStatus.Onboarding;

    // Lifecycle dates
    public DateOnly? OnboardingStartedAt { get; set; }
    public DateOnly? TestEnvReadyAt { get; set; }
    public DateOnly? ProdEnvReadyAt { get; set; }
    public DateOnly? ProductionLiveAt { get; set; }
    public DateOnly? ServiceEndedAt { get; set; }
    public string? ChurnReason { get; set; }

    // Archive
    public bool IsArchived { get; set; }
    public DateTime? ArchivedAt { get; set; }

    // Contact
    public string? PrimaryContactName { get; set; }
    public string? PrimaryContactEmail { get; set; }
    public string? PrimaryContactPhone { get; set; }

    // Custom fields (JSONB)
    public Dictionary<string, object?> CustomFields { get; set; } = [];

    // Navigation
    public ICollection<CustomerProduct> Products { get; set; } = [];

    public void Churn(DateOnly serviceEndedAt, string? reason)
    {
        Status = CustomerStatus.Churned;
        ServiceEndedAt = serviceEndedAt;
        ChurnReason = reason;
        IsArchived = true;
        ArchivedAt = DateTime.UtcNow;
    }

    public void Archive()
    {
        IsArchived = true;
        ArchivedAt = DateTime.UtcNow;
    }

    public void Restore()
    {
        IsArchived = false;
        ArchivedAt = null;
    }
}
