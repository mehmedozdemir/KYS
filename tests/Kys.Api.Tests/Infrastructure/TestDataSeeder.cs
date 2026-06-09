using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Kys.Api.Tests.Infrastructure;

/// <summary>
/// Inserts minimal test entities directly via DbContext for integration test setup.
/// All IDs use predictable prefixes so tests can reference them without querying first.
/// </summary>
public sealed class TestDataSeeder(KysWebApplicationFactory factory)
{
    // Well-known IDs from migration seeds
    public static readonly Guid ResourceTypePostgreSqlId = Guid.Parse("b0000000-0000-0000-0000-000000000003");
    public static readonly Guid EnvironmentTypeDevId    = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid EnvironmentTypeProdId   = Guid.Parse("10000000-0000-0000-0000-000000000004");

    public async Task<Person> CreatePlatformUserAsync(
        string email,
        string password,
        Guid? systemRoleId = null)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Person>>();

        var person = new Person
        {
            FirstName = "Test",
            LastName = "User",
            Email = email,
            IsPlatformUser = true,
        };
        person.PasswordHash = hasher.HashPassword(person, password);
        db.People.Add(person);

        if (systemRoleId.HasValue)
        {
            db.Set<PersonSystemRole>().Add(new PersonSystemRole
            {
                PersonId = person.Id,
                SystemRoleId = systemRoleId.Value,
                AssignedAt = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync();
        return person;
    }

    public async Task<(Customer customer, Product product, CustomerEnvironment env, EnvironmentResource resource)>
        CreateEnvironmentResourceChainAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var product = new Product
        {
            Name = "Test Product",
            Code = "TEST-PROD",
            ProductType = ProductType.SaaS,
            Status = ProductStatus.Active,
        };
        db.Products.Add(product);

        var customer = new Customer
        {
            Name = "Test Customer",
            Code = "TEST-CUST",
            Status = CustomerStatus.Active,
        };
        db.Customers.Add(customer);

        var customerProduct = new CustomerProduct
        {
            CustomerId = customer.Id,
            ProductId = product.Id,
            UsageMode = UsageMode.Dedicated,
            Status = CustomerProductStatus.Active,
        };
        db.CustomerProducts.Add(customerProduct);

        var env = new CustomerEnvironment
        {
            CustomerProductId = customerProduct.Id,
            EnvironmentTypeId = EnvironmentTypeDevId,
            Name = "Dev",
            IsActive = true,
        };
        db.CustomerEnvironments.Add(env);

        var template = new ProductResourceTemplate
        {
            ProductId = product.Id,
            ResourceTypeId = ResourceTypePostgreSqlId,
            Name = "Ana Veritabanı",
            SortOrder = 1,
        };
        db.ProductResourceTemplates.Add(template);

        var resource = new EnvironmentResource
        {
            CustomerEnvironmentId = env.Id,
            ProductResourceTemplateId = template.Id,
            IsActive = true,
        };
        db.EnvironmentResources.Add(resource);

        await db.SaveChangesAsync();
        return (customer, product, env, resource);
    }
}
