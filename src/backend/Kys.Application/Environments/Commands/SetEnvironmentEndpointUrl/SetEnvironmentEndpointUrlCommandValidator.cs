using FluentValidation;

namespace Kys.Application.Environments.Commands.SetEnvironmentEndpointUrl;

public sealed class SetEnvironmentEndpointUrlCommandValidator : AbstractValidator<SetEnvironmentEndpointUrlCommand>
{
    public SetEnvironmentEndpointUrlCommandValidator()
    {
        RuleFor(x => x.CustomerEnvironmentId).NotEmpty();
        RuleFor(x => x.ProductEndpointId).NotEmpty();
        RuleFor(x => x.BaseUrl).NotEmpty().MaximumLength(1000).Must(IsValidUrl).WithMessage("BaseUrl must be a valid URL.");
        RuleFor(x => x.SwaggerUrl).MaximumLength(1000).Must(IsValidUrl).When(x => x.SwaggerUrl != null).WithMessage("SwaggerUrl must be a valid URL.");
        RuleFor(x => x.HealthCheckUrl).MaximumLength(1000).Must(IsValidUrl).When(x => x.HealthCheckUrl != null).WithMessage("HealthCheckUrl must be a valid URL.");
    }

    private static bool IsValidUrl(string? url)
        => url == null || Uri.TryCreate(url, UriKind.Absolute, out _);
}
