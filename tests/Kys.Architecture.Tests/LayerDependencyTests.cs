using NetArchTest.Rules;

namespace Kys.Architecture.Tests;

public class LayerDependencyTests
{
    private const string DomainNamespace = "Kys.Domain";
    private const string ApplicationNamespace = "Kys.Application";
    private const string InfrastructureNamespace = "Kys.Infrastructure";
    private const string ApiNamespace = "Kys.Api";

    [Fact]
    public void Domain_Should_Not_HaveDependencyOn_Application()
    {
        var result = Types.InAssembly(typeof(Domain.Entities.Base.BaseEntity).Assembly)
            .Should()
            .NotHaveDependencyOn(ApplicationNamespace)
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailure(result));
    }

    [Fact]
    public void Domain_Should_Not_HaveDependencyOn_Infrastructure()
    {
        var result = Types.InAssembly(typeof(Domain.Entities.Base.BaseEntity).Assembly)
            .Should()
            .NotHaveDependencyOn(InfrastructureNamespace)
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailure(result));
    }

    [Fact]
    public void Domain_Should_Not_HaveDependencyOn_Api()
    {
        var result = Types.InAssembly(typeof(Domain.Entities.Base.BaseEntity).Assembly)
            .Should()
            .NotHaveDependencyOn(ApiNamespace)
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailure(result));
    }

    [Fact]
    public void Application_Should_Not_HaveDependencyOn_Infrastructure()
    {
        var result = Types.InAssembly(typeof(Application.DependencyInjection).Assembly)
            .Should()
            .NotHaveDependencyOn(InfrastructureNamespace)
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailure(result));
    }

    [Fact]
    public void Application_Should_Not_HaveDependencyOn_Api()
    {
        var result = Types.InAssembly(typeof(Application.DependencyInjection).Assembly)
            .Should()
            .NotHaveDependencyOn(ApiNamespace)
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailure(result));
    }

    [Fact]
    public void Controllers_Should_Not_HaveBusinessLogic()
    {
        // Controllers must only contain methods that dispatch to MediatR
        // They should reside in Kys.Api.Controllers namespace
        var result = Types.InAssembly(typeof(Api.Extensions.SwaggerExtensions).Assembly)
            .That()
            .ResideInNamespace($"{ApiNamespace}.Controllers")
            .Should()
            .NotHaveDependencyOn(InfrastructureNamespace)
            .And()
            .NotHaveDependencyOn($"{DomainNamespace}.Entities")
            .GetResult();

        Assert.True(result.IsSuccessful, FormatFailure(result));
    }

    private static string FormatFailure(TestResult result)
        => $"Failing types: {string.Join(", ", result.FailingTypeNames ?? [])}";
}
