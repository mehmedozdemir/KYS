using FluentValidation;

namespace Kys.Application.Environments.Commands.CreateCustomerEnvironment;

public sealed class CreateCustomerEnvironmentCommandValidator : AbstractValidator<CreateCustomerEnvironmentCommand>
{
    public CreateCustomerEnvironmentCommandValidator()
    {
        RuleFor(x => x.CustomerProductId).NotEmpty();
        RuleFor(x => x.EnvironmentTypeId).NotEmpty();
        RuleFor(x => x.Name).MaximumLength(200);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
