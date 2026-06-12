using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using Kys.Domain.Interfaces.Services;
using MediatR;

namespace Kys.Application.CustomFields.Commands.CreateCustomFieldDefinition;

public sealed class CreateCustomFieldDefinitionCommandHandler(
    ICustomFieldDefinitionRepository repository,
    IUnitOfWork unitOfWork,
    ILocalizer localizer
) : IRequestHandler<CreateCustomFieldDefinitionCommand, Guid>
{
    public async Task<Guid> Handle(CreateCustomFieldDefinitionCommand request, CancellationToken cancellationToken)
    {
        var exists = await repository.ExistsAsync(request.EntityType, request.FieldKey, cancellationToken);
        if (exists)
            throw new DomainException(localizer.Get("err.customField.alreadyDefined", request.FieldKey, request.EntityType));

        var definition = new CustomFieldDefinition
        {
            EntityType = request.EntityType,
            FieldKey = request.FieldKey.ToLowerInvariant().Replace(' ', '_'),
            DisplayName = request.DisplayName,
            FieldType = request.FieldType,
            IsRequired = request.IsRequired,
            DefaultValue = request.DefaultValue,
            SelectOptions = request.SelectOptions,
            ValidationRules = request.ValidationRules ?? [],
            DisplayOrder = request.DisplayOrder,
            GroupName = request.GroupName
        };

        await repository.AddAsync(definition, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return definition.Id;
    }
}
