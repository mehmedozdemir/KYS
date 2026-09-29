using FluentAssertions;
using Kys.Domain.Entities;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Tests;

public sealed class CustomerLifecycleTests
{
    private static readonly DateOnly Day1 = new(2026, 1, 10);
    private static readonly DateOnly Day2 = new(2026, 3, 20);

    [Fact]
    public void ChangeStatus_ToOnboarding_SetsOnboardingStartedAt()
    {
        var customer = new Customer { Status = CustomerStatus.Prospect };

        customer.ChangeStatus(CustomerStatus.Onboarding, Day1);

        customer.Status.Should().Be(CustomerStatus.Onboarding);
        customer.OnboardingStartedAt.Should().Be(Day1);
        customer.ProductionLiveAt.Should().BeNull();
    }

    [Fact]
    public void ChangeStatus_ToActive_SetsProductionLiveAt_WhenMissing()
    {
        var customer = new Customer();

        customer.ChangeStatus(CustomerStatus.Active, Day2);

        customer.ProductionLiveAt.Should().Be(Day2);
        customer.OnboardingStartedAt.Should().Be(Day2);
    }

    [Fact]
    public void ChangeStatus_DoesNotOverwriteExistingDates()
    {
        var customer = new Customer { OnboardingStartedAt = Day1, ProductionLiveAt = Day1 };

        customer.ChangeStatus(CustomerStatus.Active, Day2);

        customer.OnboardingStartedAt.Should().Be(Day1);
        customer.ProductionLiveAt.Should().Be(Day1);
    }

    [Fact]
    public void MarkEnvironmentReady_SeparatesTestAndProduction_AndKeepsFirstDate()
    {
        var customer = new Customer();

        customer.MarkEnvironmentReady(isProduction: false, Day1);
        customer.MarkEnvironmentReady(isProduction: false, Day2);
        customer.MarkEnvironmentReady(isProduction: true, Day2);

        customer.TestEnvReadyAt.Should().Be(Day1);
        customer.ProdEnvReadyAt.Should().Be(Day2);
        customer.OnboardingStartedAt.Should().Be(Day1);
    }

    [Fact]
    public void MarkProductionLive_KeepsEarliestGoLive()
    {
        var customer = new Customer();

        customer.MarkProductionLive(Day2);
        customer.MarkProductionLive(Day1);
        customer.MarkProductionLive(Day2);

        customer.ProductionLiveAt.Should().Be(Day1);
    }

    [Fact]
    public void Churn_ArchivesCustomer()
    {
        var customer = new Customer { Status = CustomerStatus.Active };

        customer.Churn(Day2, "Sağlayıcı değişikliği");

        customer.Status.Should().Be(CustomerStatus.Churned);
        customer.IsArchived.Should().BeTrue();
        customer.ServiceEndedAt.Should().Be(Day2);
        customer.ChurnReason.Should().Be("Sağlayıcı değişikliği");
    }
}
