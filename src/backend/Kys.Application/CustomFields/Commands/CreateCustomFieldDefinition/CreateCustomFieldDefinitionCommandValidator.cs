using FluentValidation;
using Kys.Domain.Enumerations;

namespace Kys.Application.CustomFields.Commands.CreateCustomFieldDefinition;

public sealed class CreateCustomFieldDefinitionCommandValidator : AbstractValidator<CreateCustomFieldDefinitionCommand>
{
    public CreateCustomFieldDefinitionCommandValidator()
    {
        RuleFor(x => x.FieldKey).NotEmpty().MaximumLength(100)
            .Matches("^[a-z][a-z0-9_]*$").WithMessage("FieldKey küçük harf, rakam ve alt çizgi içerebilir, harf ile başlamalıdır.");
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.SelectOptions).NotEmpty()
            .When(x => x.FieldType == CustomFieldType.Select)
            .WithMessage("Select tipi alanlar için SelectOptions zorunludur.");
    }
}
