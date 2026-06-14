using FluentValidation;

namespace Kys.Application.Customers.Commands.UpdateCustomerVpnConfig;

public sealed class UpdateCustomerVpnConfigCommandValidator : AbstractValidator<UpdateCustomerVpnConfigCommand>
{
    public UpdateCustomerVpnConfigCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.ServerHost).NotEmpty().MaximumLength(255);
    }
}
