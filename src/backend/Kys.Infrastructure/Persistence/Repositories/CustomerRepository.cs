using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Kys.Infrastructure.Persistence.Repositories;

public sealed class CustomerRepository(AppDbContext dbContext) : ICustomerRepository
{
    public async Task<(IReadOnlyList<Customer> Items, int TotalCount)> GetAllAsync(
        string? search, CustomerStatus? status, bool includeArchived,
        int page, int pageSize, Guid? scopeUserId = null, CancellationToken ct = default)
    {
        var query = dbContext.Customers.AsNoTracking();

        // Katman B okuma kapsamı: scopeUserId verildiyse yalnızca kapsamdaki ürünü kullanan müşteriler
        if (scopeUserId is { } uid)
            query = query.Where(c => c.Products.Any(cp =>
                cp.Product.PoPersonId == uid ||
                cp.Product.Teams.Any(pt => pt.Team.Memberships.Any(m => m.PersonId == uid && m.EndDate == null)) ||
                cp.Product.Assignments.Any(a => a.PersonId == uid && a.IsActive)));

        if (!includeArchived)
            query = query.Where(c => !c.IsArchived);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || c.Code.Contains(search));

        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .Include(c => c.Products).ThenInclude(cp => cp.Product)
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<Customer?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.Customers
            .Include(c => c.Products).ThenInclude(cp => cp.Product)
            .Include(c => c.VpnConfigs).ThenInclude(v => v.CustomerEnvironment)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<bool> ExistsByCodeAsync(string code, CancellationToken ct = default)
        => await dbContext.Customers.AnyAsync(c => c.Code == code, ct);

    public async Task AddAsync(Customer customer, CancellationToken ct = default)
        => await dbContext.Customers.AddAsync(customer, ct);

    public void Update(Customer customer)
        => dbContext.Customers.Update(customer);

    public async Task<IReadOnlyList<CustomerProduct>> GetProductsAsync(Guid customerId, CancellationToken ct = default)
        => await dbContext.CustomerProducts
            .Include(cp => cp.Product)
            .AsNoTracking()
            .Where(cp => cp.CustomerId == customerId)
            .ToListAsync(ct);

    public async Task<CustomerProduct?> GetCustomerProductAsync(Guid customerId, Guid productId, CancellationToken ct = default)
        => await dbContext.CustomerProducts
            .FirstOrDefaultAsync(cp => cp.CustomerId == customerId && cp.ProductId == productId, ct);

    public async Task<CustomerProduct?> GetCustomerProductByIdAsync(Guid customerProductId, CancellationToken ct = default)
        => await dbContext.CustomerProducts.FindAsync([customerProductId], ct);

    public async Task AddCustomerProductAsync(CustomerProduct customerProduct, CancellationToken ct = default)
        => await dbContext.CustomerProducts.AddAsync(customerProduct, ct);

    public void UpdateCustomerProduct(CustomerProduct customerProduct)
        => dbContext.CustomerProducts.Update(customerProduct);

    public void RemoveCustomerProduct(CustomerProduct customerProduct)
        => dbContext.CustomerProducts.Remove(customerProduct);

    public async Task<IReadOnlyList<CustomerVpnConfig>> GetVpnConfigsAsync(Guid customerId, CancellationToken ct = default)
        => await dbContext.CustomerVpnConfigs
            .Include(v => v.CustomerEnvironment)
            .AsNoTracking()
            .Where(v => v.CustomerId == customerId)
            .OrderBy(v => v.SortOrder)
            .ThenBy(v => v.Name)
            .ToListAsync(ct);

    public async Task<CustomerVpnConfig?> GetVpnConfigByIdAsync(Guid id, CancellationToken ct = default)
        => await dbContext.CustomerVpnConfigs.FindAsync([id], ct);

    public async Task AddVpnConfigAsync(CustomerVpnConfig config, CancellationToken ct = default)
        => await dbContext.CustomerVpnConfigs.AddAsync(config, ct);

    public void UpdateVpnConfig(CustomerVpnConfig config)
        => dbContext.CustomerVpnConfigs.Update(config);
}
