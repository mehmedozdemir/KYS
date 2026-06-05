namespace Kys.Domain.Entities;

public sealed class ProductAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid PersonId { get; set; }
    public string? Responsibility { get; set; }
    public DateOnly? StartedAt { get; set; }
    public DateOnly? EndedAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Product Product { get; set; } = null!;
    public Person Person { get; set; } = null!;
}
