using FluentValidation;

namespace Kys.Application.Customers.Commands.CreateCustomerVpnConfig;

public sealed class CreateCustomerVpnConfigCommandValidator : AbstractValidator<CreateCustomerVpnConfigCommand>
{
    public CreateCustomerVpnConfigCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.ServerHost).NotEmpty().MaximumLength(255);
    }
}
