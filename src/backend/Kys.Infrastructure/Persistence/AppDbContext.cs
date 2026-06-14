using Kys.Domain.Entities;
using Kys.Domain.Entities.Base;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Person> People => Set<Person>();
    public DbSet<SystemRole> SystemRoles => Set<SystemRole>();
    public DbSet<PersonSystemRole> PersonSystemRoles => Set<PersonSystemRole>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<OrganizationRole> OrganizationRoles => Set<OrganizationRole>();
    public DbSet<TeamMembership> TeamMemberships => Set<TeamMembership>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductTeam> ProductTeams => Set<ProductTeam>();
    public DbSet<ProductAssignment> ProductAssignments => Set<ProductAssignment>();
    public DbSet<ProductEndpoint> ProductEndpoints => Set<ProductEndpoint>();
    public DbSet<ProductResourceTemplate> ProductResourceTemplates => Set<ProductResourceTemplate>();
    public DbSet<ResourceType> ResourceTypes => Set<ResourceType>();
    public DbSet<CustomFieldDefinition> CustomFieldDefinitions => Set<CustomFieldDefinition>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerProduct> CustomerProducts => Set<CustomerProduct>();
    public DbSet<EnvironmentType> EnvironmentTypes => Set<EnvironmentType>();
    public DbSet<HostingPlatform> HostingPlatforms => Set<HostingPlatform>();
    public DbSet<CustomerEnvironment> CustomerEnvironments => Set<CustomerEnvironment>();
    public DbSet<SharedResource> SharedResources => Set<SharedResource>();
    public DbSet<EnvironmentResource> EnvironmentResources => Set<EnvironmentResource>();
    public DbSet<ResourceCredential> ResourceCredentials => Set<ResourceCredential>();
    public DbSet<PersonalCredential> PersonalCredentials => Set<PersonalCredential>();
    public DbSet<CustomerVpnConfig> CustomerVpnConfigs => Set<CustomerVpnConfig>();
    public DbSet<CustomerEnvironmentEndpoint> CustomerEnvironmentEndpoints => Set<CustomerEnvironmentEndpoint>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<KbArticle> KbArticles => Set<KbArticle>();
    public DbSet<KbTag> KbTags => Set<KbTag>();
    public DbSet<KbArticleTag> KbArticleTags => Set<KbArticleTag>();
    public DbSet<AccessGrant> AccessGrants => Set<AccessGrant>();
    public DbSet<EmailAccount> EmailAccounts => Set<EmailAccount>();
    public DbSet<OrganizationProfile> OrganizationProfiles => Set<OrganizationProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
                continue;

            var method = typeof(AppDbContext)
                .GetMethod(nameof(SetSoftDeleteFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!
                .MakeGenericMethod(entityType.ClrType);

            method.Invoke(null, [modelBuilder]);
        }
    }

    private static void SetSoftDeleteFilter<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ISoftDelete
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => !e.IsDeleted);
    }
}
