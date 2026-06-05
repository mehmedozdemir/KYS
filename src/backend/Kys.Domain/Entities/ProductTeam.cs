namespace Kys.Domain.Entities;

public sealed class ProductTeam
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Guid TeamId { get; set; }
    public string? Role { get; set; }  // Owner | Contributor | Support
    public DateOnly? Since { get; set; }

    // Navigation
    public Product Product { get; set; } = null!;
    public Team Team { get; set; } = null!;
}
