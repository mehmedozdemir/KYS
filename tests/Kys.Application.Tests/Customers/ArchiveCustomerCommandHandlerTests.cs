using FluentAssertions;
using Kys.Application.Customers.Commands.ArchiveCustomer;
using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using NSubstitute;

namespace Kys.Application.Tests.Customers;

public sealed class ArchiveCustomerCommandHandlerTests
{
    private readonly ICustomerRepository _customerRepository = Substitute.For<ICustomerRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ArchiveCustomerCommandHandler _handler;

    public ArchiveCustomerCommandHandlerTests()
    {
        _handler = new ArchiveCustomerCommandHandler(_customerRepository, _unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenCustomerNotFound_ThrowsNotFoundException()
    {
        var id = Guid.NewGuid();
        _customerRepository.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Customer?)null);

        var act = () => _handler.Handle(new ArchiveCustomerCommand(id), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_WhenAlreadyArchived_ThrowsDomainException()
    {
        var customer = new Customer { IsArchived = true };
        _customerRepository.GetByIdAsync(customer.Id, Arg.Any<CancellationToken>()).Returns(customer);

        var act = () => _handler.Handle(new ArchiveCustomerCommand(customer.Id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage("*zaten arşivlenmiş*");
    }

    [Fact]
    public async Task Handle_WhenActiveCustomer_ArchivesAndSaves()
    {
        var customer = new Customer { IsArchived = false };
        _customerRepository.GetByIdAsync(customer.Id, Arg.Any<CancellationToken>()).Returns(customer);

        await _handler.Handle(new ArchiveCustomerCommand(customer.Id), CancellationToken.None);

        customer.IsArchived.Should().BeTrue();
        customer.ArchivedAt.Should().NotBeNull();
        _customerRepository.Received(1).Update(customer);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
