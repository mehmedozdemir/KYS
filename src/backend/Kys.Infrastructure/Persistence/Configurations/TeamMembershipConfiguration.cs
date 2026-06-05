using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class TeamMembershipConfiguration : IEntityTypeConfiguration<TeamMembership>
{
    public void Configure(EntityTypeBuilder<TeamMembership> builder)
    {
        builder.HasKey(tm => tm.Id);

        builder.HasIndex(tm => new { tm.PersonId, tm.TeamId, tm.EndDate })
            .HasFilter("end_date IS NULL");

        builder.HasOne(tm => tm.OrganizationRole)
            .WithMany(or => or.TeamMemberships)
            .HasForeignKey(tm => tm.OrganizationRoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
