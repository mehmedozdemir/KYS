using Kys.Domain.Entities;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Interfaces.Repositories;

public interface ICustomerRepository
{
    Task<(IReadOnlyList<Customer> Items, int TotalCount)> GetAllAsync(
        string? search, CustomerStatus? status, bool includeArchived,
        int page, int pageSize, CancellationToken ct = default);

    Task<Customer?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsByCodeAsync(string code, CancellationToken ct = default);

    Task AddAsync(Customer customer, CancellationToken ct = default);
    void Update(Customer customer);

    // CustomerProduct
    Task<IReadOnlyList<CustomerProduct>> GetProductsAsync(Guid customerId, CancellationToken ct = default);
    Task<CustomerProduct?> GetCustomerProductAsync(Guid customerId, Guid productId, CancellationToken ct = default);
    Task<CustomerProduct?> GetCustomerProductByIdAsync(Guid customerProductId, CancellationToken ct = default);
    Task AddCustomerProductAsync(CustomerProduct customerProduct, CancellationToken ct = default);
    void UpdateCustomerProduct(CustomerProduct customerProduct);
    void RemoveCustomerProduct(CustomerProduct customerProduct);
}
