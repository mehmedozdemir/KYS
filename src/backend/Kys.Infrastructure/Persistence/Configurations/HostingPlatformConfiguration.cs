using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class HostingPlatformConfiguration : IEntityTypeConfiguration<HostingPlatform>
{
    public void Configure(EntityTypeBuilder<HostingPlatform> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(30);
        builder.Property(x => x.Category).HasMaxLength(50);
        builder.Property(x => x.Icon).HasMaxLength(50);
        builder.Property(x => x.Color).HasMaxLength(7);
        builder.HasIndex(x => x.Code).IsUnique();

        builder.HasData(
            new HostingPlatform { Id = new Guid("20000000-0000-0000-0000-000000000001"), Name = "Kubernetes",      Code = "K8S",     Category = "Konteyner", Icon = "pi-server",  Color = "#326CE5", SortOrder = 1, IsActive = true },
            new HostingPlatform { Id = new Guid("20000000-0000-0000-0000-000000000002"), Name = "Docker / Compose", Code = "DOCKER",  Category = "Konteyner", Icon = "pi-box",     Color = "#2496ED", SortOrder = 2, IsActive = true },
            new HostingPlatform { Id = new Guid("20000000-0000-0000-0000-000000000003"), Name = "Linux Sunucu",     Code = "LINUX",   Category = "Sunucu",    Icon = "pi-server",  Color = "#F0AB00", SortOrder = 3, IsActive = true },
            new HostingPlatform { Id = new Guid("20000000-0000-0000-0000-000000000004"), Name = "Windows Sunucu",   Code = "WINDOWS", Category = "Sunucu",    Icon = "pi-microsoft", Color = "#0078D6", SortOrder = 4, IsActive = true },
            new HostingPlatform { Id = new Guid("20000000-0000-0000-0000-000000000005"), Name = "AWS",              Code = "AWS",     Category = "Bulut",     Icon = "pi-cloud",   Color = "#FF9900", SortOrder = 5, IsActive = true },
            new HostingPlatform { Id = new Guid("20000000-0000-0000-0000-000000000006"), Name = "Azure",            Code = "AZURE",   Category = "Bulut",     Icon = "pi-cloud",   Color = "#0078D4", SortOrder = 6, IsActive = true },
            new HostingPlatform { Id = new Guid("20000000-0000-0000-0000-000000000007"), Name = "Google Cloud",     Code = "GCP",     Category = "Bulut",     Icon = "pi-cloud",   Color = "#4285F4", SortOrder = 7, IsActive = true }
        );
    }
}
