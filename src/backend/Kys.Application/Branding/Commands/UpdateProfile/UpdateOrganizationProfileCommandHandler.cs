using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Branding.Commands.UpdateProfile;

public sealed class UpdateOrganizationProfileCommandHandler(
    IOrganizationProfileRepository repository,
    IUnitOfWork unitOfWork) : IRequestHandler<UpdateOrganizationProfileCommand>
{
    public async Task Handle(UpdateOrganizationProfileCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName))
            throw new DomainException("Şirket adı zorunludur.");

        var p = await repository.GetAsync(ct);
        p.CompanyName = request.CompanyName.Trim();
        p.ShortName = request.ShortName?.Trim();
        p.Website = request.Website?.Trim();
        p.Slogan = request.Slogan?.Trim();
        p.ContactEmail = request.ContactEmail?.Trim();
        p.ContactPhone = request.ContactPhone?.Trim();
        p.Address = request.Address?.Trim();
        p.TaxNumber = request.TaxNumber?.Trim();

        repository.Update(p);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
