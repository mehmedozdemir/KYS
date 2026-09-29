using FluentAssertions;
using Kys.Application.Customers.Commands.AddProductToCustomer;
using Kys.Domain.Entities;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using NSubstitute;

namespace Kys.Application.Tests.Customers;

public sealed class AddProductToCustomerCommandHandlerTests
{
    private readonly ICustomerRepository _customerRepository = Substitute.For<ICustomerRepository>();
    private readonly IProductRepository _productRepository = Substitute.For<IProductRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly AddProductToCustomerCommandHandler _handler;
    private readonly Customer _customer = new();

    public AddProductToCustomerCommandHandlerTests()
    {
        _customerRepository.GetByIdAsync(_customer.Id, Arg.Any<CancellationToken>()).Returns(_customer);
        _handler = new AddProductToCustomerCommandHandler(_customerRepository, _productRepository, _unitOfWork);
    }

    private Product GivenProduct(ProductType type)
    {
        var product = new Product { ProductType = type };
        _productRepository.GetByIdAsync(product.Id, Arg.Any<CancellationToken>()).Returns(product);
        return product;
    }

    [Theory]
    [InlineData(ProductType.SaaS, UsageMode.Dedicated)]
    [InlineData(ProductType.CustomerBased, UsageMode.SaaS)]
    public async Task Handle_UsageModeNotAllowedForProductType_Throws(ProductType type, UsageMode mode)
    {
        var product = GivenProduct(type);

        var act = () => _handler.Handle(new AddProductToCustomerCommand(_customer.Id, product.Id, mode, null), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage("err.customer.usageModeNotAllowed");
        await _customerRepository.DidNotReceive().AddCustomerProductAsync(Arg.Any<CustomerProduct>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(ProductType.SaaS, UsageMode.SaaS)]
    [InlineData(ProductType.CustomerBased, UsageMode.Dedicated)]
    [InlineData(ProductType.Hybrid, UsageMode.SaaS)]
    [InlineData(ProductType.Hybrid, UsageMode.Dedicated)]
    public async Task Handle_AllowedUsageMode_AddsProduct(ProductType type, UsageMode mode)
    {
        var product = GivenProduct(type);

        await _handler.Handle(new AddProductToCustomerCommand(_customer.Id, product.Id, mode, null), CancellationToken.None);

        await _customerRepository.Received(1).AddCustomerProductAsync(
            Arg.Is<CustomerProduct>(cp => cp.ProductId == product.Id && cp.UsageMode == mode), Arg.Any<CancellationToken>());
    }
}
