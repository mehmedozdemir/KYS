using FluentValidation;
using FluentValidation.Results;
using Kys.Application.CustomFields;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.Behaviors;

public sealed class CustomFieldBehavior<TRequest, TResponse>(ICustomFieldValidatorService validator)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (request is not IHasCustomFields hasCustomFields)
            return await next(cancellationToken);

        var errors = await validator.ValidateAsync(
            hasCustomFields.EntityType,
            hasCustomFields.CustomFields,
            cancellationToken);

        if (errors.Count > 0)
        {
            var failures = errors
                .Select(e => new ValidationFailure(e.FieldKey, e.Message))
                .ToList();
            throw new ValidationException(failures);
        }

        return await next(cancellationToken);
    }
}
