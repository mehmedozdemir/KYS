using Kys.Domain.Entities;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.CustomFields.Commands.ToggleCustomFieldDefinition;

public sealed class ToggleCustomFieldDefinitionCommandHandler(
    ICustomFieldDefinitionRepository repository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ToggleCustomFieldDefinitionCommand, bool>
{
    public async Task<bool> Handle(ToggleCustomFieldDefinitionCommand request, CancellationToken cancellationToken)
    {
        var definition = await repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CustomFieldDefinition), request.Id);

        definition.IsActive = !definition.IsActive;

        repository.Update(definition);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return definition.IsActive;
    }
}
