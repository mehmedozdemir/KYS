using Kys.Domain.Entities.Base;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Entities;

public sealed class CustomerProduct : AuditableEntity
{
    public Guid CustomerId { get; set; }
    public Guid ProductId { get; set; }

    public UsageMode UsageMode { get; set; }
    public CustomerProductStatus Status { get; set; } = CustomerProductStatus.Onboarding;

    // Installation timeline (Dedicated only)
    public DateOnly? InstallationStartedAt { get; set; }
    public DateOnly? TestReadyAt { get; set; }
    public DateOnly? ProdReadyAt { get; set; }
    public DateOnly? GoLiveAt { get; set; }
    public DateOnly? DiscontinuedAt { get; set; }

    public string? Notes { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
