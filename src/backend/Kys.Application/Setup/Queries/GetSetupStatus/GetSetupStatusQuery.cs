using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Setup.Queries.GetSetupStatus;

public sealed record GetSetupStatusQuery : IRequest<SetupStatusResult>;

public sealed record SetupStatusResult(bool IsInitialized);

public sealed class GetSetupStatusQueryHandler(IPersonRepository personRepository)
    : IRequestHandler<GetSetupStatusQuery, SetupStatusResult>
{
    public async Task<SetupStatusResult> Handle(GetSetupStatusQuery request, CancellationToken cancellationToken)
    {
        var hasUsers = await personRepository.HasAnyPlatformUserAsync(cancellationToken);
        return new SetupStatusResult(hasUsers);
    }
}
