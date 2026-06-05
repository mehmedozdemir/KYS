namespace Kys.Domain.Entities;

public sealed class SystemRole
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<string> Permissions { get; set; } = [];
    public bool IsSystem { get; set; }

    // Navigation
    public ICollection<PersonSystemRole> PersonRoles { get; set; } = [];

    public static class Codes
    {
        public const string PlatformAdmin = "PlatformAdmin";
        public const string Director = "Director";
        public const string TeamLead = "TeamLead";
        public const string Developer = "Developer";
        public const string ReadOnly = "ReadOnly";
    }
}
