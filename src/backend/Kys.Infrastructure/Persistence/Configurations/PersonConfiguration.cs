using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class PersonConfiguration : IEntityTypeConfiguration<Person>
{
    public void Configure(EntityTypeBuilder<Person> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(p => p.LastName).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Email).HasMaxLength(255).IsRequired();
        builder.Property(p => p.Phone).HasMaxLength(50);
        builder.Property(p => p.Title).HasMaxLength(100);
        builder.Property(p => p.EmploymentStatus)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();
        builder.Property(p => p.Username).HasMaxLength(100);
        builder.Property(p => p.RefreshToken).HasMaxLength(200);
        builder.Property(p => p.TerminationReason).HasMaxLength(1000);

        builder.Property(p => p.CustomFields)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'");

        builder.HasIndex(p => p.Email)
            .IsUnique()
            .HasFilter("is_deleted = false");

        builder.HasIndex(p => p.Username)
            .IsUnique()
            .HasFilter("username IS NOT NULL AND is_deleted = false");

        builder.HasIndex(p => p.EmploymentStatus)
            .HasFilter("is_deleted = false");

        builder.HasMany(p => p.SystemRoles)
            .WithOne(psr => psr.Person)
            .HasForeignKey(psr => psr.PersonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.TeamMemberships)
            .WithOne(tm => tm.Person)
            .HasForeignKey(tm => tm.PersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
