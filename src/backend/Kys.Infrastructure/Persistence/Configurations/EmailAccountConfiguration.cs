using Kys.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kys.Infrastructure.Persistence.Configurations;

public sealed class EmailAccountConfiguration : IEntityTypeConfiguration<EmailAccount>
{
    public void Configure(EntityTypeBuilder<EmailAccount> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Provider).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Host).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Security).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(x => x.Username).IsRequired().HasMaxLength(200);
        builder.Property(x => x.EncryptedPassword).IsRequired();
        builder.Property(x => x.FromAddress).IsRequired().HasMaxLength(200);
        builder.Property(x => x.FromName).HasMaxLength(150);
    }
}
