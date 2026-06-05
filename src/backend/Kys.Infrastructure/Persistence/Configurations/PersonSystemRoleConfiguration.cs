using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class PersonSystemRoleConfiguration : IEntityTypeConfiguration<PersonSystemRole>
{
    public void Configure(EntityTypeBuilder<PersonSystemRole> builder)
    {
        builder.HasKey(x => new { x.PersonId, x.SystemRoleId });

        builder.Property(x => x.AssignedAt).IsRequired();

        builder.HasOne(x => x.Person)
            .WithMany(p => p.SystemRoles)
            .HasForeignKey(x => x.PersonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.SystemRole)
            .WithMany()
            .HasForeignKey(x => x.SystemRoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
