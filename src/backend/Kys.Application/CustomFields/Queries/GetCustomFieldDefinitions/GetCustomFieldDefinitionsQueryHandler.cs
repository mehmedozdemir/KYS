using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.CustomFields.Queries.GetCustomFieldDefinitions;

public sealed class GetCustomFieldDefinitionsQueryHandler(ICustomFieldDefinitionRepository repository)
    : IRequestHandler<GetCustomFieldDefinitionsQuery, IReadOnlyList<CustomFieldDefinitionDto>>
{
    public async Task<IReadOnlyList<CustomFieldDefinitionDto>> Handle(
        GetCustomFieldDefinitionsQuery request,
        CancellationToken cancellationToken)
    {
        var definitions = await repository.GetByEntityTypeAsync(request.EntityType, request.ActiveOnly, cancellationToken);

        return definitions
            .OrderBy(d => d.DisplayOrder)
            .Select(d => new CustomFieldDefinitionDto(
                d.Id,
                d.EntityType,
                d.FieldKey,
                d.DisplayName,
                d.FieldType,
                d.IsRequired,
                d.DefaultValue,
                d.SelectOptions?.AsReadOnly(),
                d.ValidationRules,
                d.DisplayOrder,
                d.GroupName,
                d.IsActive))
            .ToList();
    }
}
