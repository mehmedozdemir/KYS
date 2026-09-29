using FluentAssertions;
using Kys.Domain.Deployment;
using Kys.Domain.Enumerations;

namespace Kys.Domain.Tests;

public sealed class DeploymentStageResolverTests
{
    private static readonly DateOnly Today = new(2026, 9, 29);

    private static DeploymentFacts Facts(
        CustomerProductStatus status = CustomerProductStatus.Onboarding,
        UsageMode mode = UsageMode.Dedicated,
        bool nonProd = false, bool prod = false,
        DateOnly? target = null, DateOnly? goLive = null, DateOnly? prodReady = null) =>
        new(mode, status, nonProd, prod, new DateOnly(2026, 1, 1), null, nonProd ? new DateOnly(2026, 2, 1) : null,
            prodReady, goLive, target, null);

    [Theory]
    [InlineData(false, false, DeploymentStage.Planned)]
    [InlineData(true, false, DeploymentStage.Installing)]
    [InlineData(true, true, DeploymentStage.ProdReady)]
    [InlineData(false, true, DeploymentStage.ProdReady)]
    public void Onboarding_StageFollowsEnvironments(bool nonProd, bool prod, DeploymentStage expected)
        => DeploymentStageResolver.Assess(Facts(nonProd: nonProd, prod: prod), Today).Stage.Should().Be(expected);

    [Fact]
    public void Onboarding_ProdWithMissingRequiredResources_IsStillInstalling()
        => DeploymentStageResolver.Assess(Facts(nonProd: true, prod: true) with { ProdMissingRequiredResources = true }, Today)
            .Stage.Should().Be(DeploymentStage.Installing);

    [Fact]
    public void Active_WithMissingRequiredResources_StaysLive()
        => DeploymentStageResolver.Assess(Facts(CustomerProductStatus.Active, nonProd: true, prod: true) with { ProdMissingRequiredResources = true }, Today)
            .Stage.Should().Be(DeploymentStage.Live);

    [Fact]
    public void Saas_Onboarding_IsPlanned_EvenWithoutEnvironments()
        => DeploymentStageResolver.Assess(Facts(mode: UsageMode.SaaS), Today).Stage.Should().Be(DeploymentStage.Planned);

    [Theory]
    [InlineData(CustomerProductStatus.Active, DeploymentStage.Live)]
    [InlineData(CustomerProductStatus.Inactive, DeploymentStage.Inactive)]
    [InlineData(CustomerProductStatus.Discontinued, DeploymentStage.Discontinued)]
    public void Status_OverridesEnvironments(CustomerProductStatus status, DeploymentStage expected)
        => DeploymentStageResolver.Assess(Facts(status, nonProd: true, prod: true), Today).Stage.Should().Be(expected);

    [Fact]
    public void ProdReady_PastTarget_IsOverdue()
    {
        var a = DeploymentStageResolver.Assess(Facts(nonProd: true, prod: true, target: new DateOnly(2026, 9, 15),
            prodReady: new DateOnly(2026, 9, 1)), Today);

        a.IsOverdue.Should().BeTrue();
        a.OverdueDays.Should().Be(14);
        a.StageSince.Should().Be(new DateOnly(2026, 9, 1));
    }

    [Fact]
    public void Live_PastTarget_IsNotOverdue()
    {
        var a = DeploymentStageResolver.Assess(Facts(CustomerProductStatus.Active, target: new DateOnly(2026, 1, 1),
            goLive: new DateOnly(2026, 3, 1)), Today);

        a.IsOverdue.Should().BeFalse();
        a.StageSince.Should().Be(new DateOnly(2026, 3, 1));
    }

    [Fact]
    public void FutureTarget_IsNotOverdue()
        => DeploymentStageResolver.Assess(Facts(nonProd: true, target: new DateOnly(2026, 12, 1)), Today).IsOverdue.Should().BeFalse();
}
