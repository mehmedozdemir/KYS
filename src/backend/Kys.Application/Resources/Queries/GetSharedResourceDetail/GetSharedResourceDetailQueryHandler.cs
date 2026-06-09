using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Resources.Queries.GetSharedResourceDetail;

public sealed class GetSharedResourceDetailQueryHandler(
    IResourceRepository resourceRepository,
    IEnvironmentRepository envRepository)
    : IRequestHandler<GetSharedResourceDetailQuery, SharedResourceDetailDto?>
{
    public async Task<SharedResourceDetailDto?> Handle(GetSharedResourceDetailQuery request, CancellationToken ct)
    {
        var resource = await resourceRepository.GetSharedResourceByIdAsync(request.Id, ct);
        if (resource is null) return null;

        var credentials = await envRepository.GetSharedCredentialsAsync(request.Id, ct);

        return new SharedResourceDetailDto(
            resource.Id,
            resource.Name,
            resource.Description,
            resource.ResourceTypeId,
            resource.ResourceType.Name,
            resource.ResourceType.Code,
            resource.EnvironmentScope,
            resource.ConnectionFields,
            resource.ResourceType.FieldSchema,
            credentials.Select(c => new SharedCredentialStubDto(c.Id, c.FieldKey, c.LastRotatedAt)).ToList());
    }
}
