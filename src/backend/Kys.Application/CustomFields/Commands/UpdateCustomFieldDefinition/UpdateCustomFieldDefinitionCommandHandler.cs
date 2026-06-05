using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.CustomFields.Commands.UpdateCustomFieldDefinition;

public sealed class UpdateCustomFieldDefinitionCommandHandler(
    ICustomFieldDefinitionRepository repository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateCustomFieldDefinitionCommand>
{
    public async Task Handle(UpdateCustomFieldDefinitionCommand request, CancellationToken cancellationToken)
    {
        var definition = await repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomFieldDefinition), request.Id);

        definition.DisplayName = request.DisplayName;
        definition.IsRequired = request.IsRequired;
        definition.DefaultValue = request.DefaultValue;
        definition.SelectOptions = request.SelectOptions;
        definition.ValidationRules = request.ValidationRules ?? [];
        definition.DisplayOrder = request.DisplayOrder;
        definition.GroupName = request.GroupName;

        repository.Update(definition);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
