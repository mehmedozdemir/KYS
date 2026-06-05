using FluentValidation;

namespace Kys.Application.Products.Commands.CreateProduct;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50)
            .Matches("^[A-Z0-9_-]+$").WithMessage("Code must contain only uppercase letters, digits, hyphens, and underscores.");
        RuleFor(x => x.RepositoryUrl).MaximumLength(500).When(x => x.RepositoryUrl is not null);
        RuleFor(x => x.DocumentationUrl).MaximumLength(500).When(x => x.DocumentationUrl is not null);
    }
}
