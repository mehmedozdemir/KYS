using Kys.Domain.Authorization;
using Kys.Domain.Deployment;
using Kys.Domain.Enumerations;
using Kys.Domain.Exceptions;
using Kys.Domain.Interfaces.Repositories;
using MediatR;

namespace Kys.Application.Deployments;

// ── DTO'lar ────────────────────────────────────────────────────────────────

public sealed record DeploymentEnvironmentDto(
    Guid Id, string Name, string TypeCode, string TypeName, string? TypeColor, string? PlatformName, string? DeployedVersion, bool IsActive,
    int MissingRequiredCount);

public sealed record ProductDeploymentRowDto(
    Guid CustomerId, string CustomerName, string CustomerCode, CustomerStatus CustomerStatus, bool CustomerArchived,
    Guid? CustomerProductId, DeploymentStage Stage, DateOnly? StageSince, bool IsOverdue, int? OverdueDays,
    UsageMode? UsageMode, DateOnly? InstallationStartedAt, DateOnly? GoLiveAt, DateOnly? TargetGoLiveAt, DateOnly? DiscontinuedAt,
    string? ProdVersion, bool IsOutdated, IReadOnlyList<DeploymentEnvironmentDto> Environments,
    int MissingRequiredResources);

public sealed record VersionShareDto(string Version, int CustomerCount, bool IsCurrent);

public sealed record ProductDeploymentsDto(
    Guid ProductId, string ProductName, string ProductCode, string? CurrentVersion, ProductType ProductType,
    IReadOnlyDictionary<DeploymentStage, int> StageCounts, int OverdueCount, bool IncludesNonUsers,
    IReadOnlyList<VersionShareDto> VersionDistribution, IReadOnlyList<ProductDeploymentRowDto> Rows);

public sealed record MatrixProductDto(Guid Id, string Name, string Code);
public sealed record MatrixCustomerDto(Guid Id, string Name, string Code, CustomerStatus Status);
public sealed record MatrixCellDto(
    Guid CustomerId, Guid ProductId, DeploymentStage Stage, bool IsOverdue, string? ProdVersion, int MissingRequiredResources);
public sealed record DeploymentMatrixDto(
    IReadOnlyList<MatrixProductDto> Products, IReadOnlyList<MatrixCustomerDto> Customers, IReadOnlyList<MatrixCellDto> Cells);

// ── Ortak hesaplama ────────────────────────────────────────────────────────

internal static class DeploymentCalculator
{
    public static DeploymentAssessment Assess(DeploymentLinkRow link, IReadOnlyList<DeploymentEnvironmentRow> envs, DateOnly today)
    {
        var active = envs.Where(e => e.IsActive).ToList();
        return DeploymentStageResolver.Assess(new DeploymentFacts(
            link.UsageMode, link.Status,
            HasNonProdEnvironment: active.Any(e => !IsProd(e)),
            HasProdEnvironment: active.Any(IsProd),
            DateOnly.FromDateTime(link.CreatedAt),
            link.InstallationStartedAt, link.TestReadyAt, link.ProdReadyAt,
            link.GoLiveAt, link.TargetGoLiveAt, link.DiscontinuedAt,
            ProdMissingRequiredResources: active.Any(e => IsProd(e) && e.MissingRequiredCount > 0)), today);
    }

    // Aktif ortamlardaki toplam eksik zorunlu kaynak sayısı (ortam başına ayrı sayılır)
    public static int MissingRequired(IReadOnlyList<DeploymentEnvironmentRow> envs)
        => envs.Where(e => e.IsActive).Sum(e => e.MissingRequiredCount);

    public static bool IsProd(DeploymentEnvironmentRow e) => string.Equals(e.TypeCode, "PROD", StringComparison.OrdinalIgnoreCase);

    // Müşterinin "kurulu sürümü" = aktif Prod ortamındaki sürüm (yoksa null)
    public static string? ProdVersion(IReadOnlyList<DeploymentEnvironmentRow> envs)
        => envs.Where(e => e.IsActive && IsProd(e) && !string.IsNullOrWhiteSpace(e.DeployedVersion))
               .Select(e => e.DeployedVersion!.Trim()).FirstOrDefault();

    // Tablo sıralaması: yapılacak iş önce (gecikenler, prod bekleyenler, kurulum), sonra canlı, en sonda kullanmayanlar
    public static int SortRank(DeploymentStage s) => s switch
    {
        DeploymentStage.ProdReady => 0,
        DeploymentStage.Installing => 1,
        DeploymentStage.Planned => 2,
        DeploymentStage.Live => 3,
        DeploymentStage.Inactive => 4,
        DeploymentStage.Discontinued => 5,
        _ => 6
    };

    public static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);
}

// ── Ürün kurulum tablosu ───────────────────────────────────────────────────

public sealed record GetProductDeploymentsQuery(Guid ProductId) : IRequest<ProductDeploymentsDto>;

public sealed class GetProductDeploymentsQueryHandler(IDeploymentRepository repository, IScopeService scope)
    : IRequestHandler<GetProductDeploymentsQuery, ProductDeploymentsDto>
{
    public async Task<ProductDeploymentsDto> Handle(GetProductDeploymentsQuery request, CancellationToken ct)
    {
        var product = (await repository.GetProductsAsync(request.ProductId, ct)).FirstOrDefault()
            ?? throw new NotFoundException("Product", request.ProductId);

        if (!await scope.CanReadAsync(new ScopeTarget(ScopeKind.Product, product.Id), ct))
            throw new ForbiddenException("err.forbidden.product");

        // Ürünü kullanmayan müşteriler tüm müşteri listesini açar → yalnızca global okuma yetkisiyle.
        var includeNonUsers = scope.HasGlobalReadAccess();

        var customers = await repository.GetCustomersAsync(ct);
        var links = (await repository.GetLinksAsync(product.Id, ct)).ToDictionary(l => l.CustomerId);
        var envsByLink = (await repository.GetEnvironmentsAsync(product.Id, ct))
            .GroupBy(e => e.CustomerProductId).ToDictionary(g => g.Key, g => (IReadOnlyList<DeploymentEnvironmentRow>)g.ToList());
        var today = DeploymentCalculator.Today;

        var rows = new List<ProductDeploymentRowDto>();
        foreach (var c in customers)
        {
            if (links.TryGetValue(c.Id, out var link))
            {
                var envs = envsByLink.GetValueOrDefault(link.Id) ?? [];
                var a = DeploymentCalculator.Assess(link, envs, today);
                var prodVersion = DeploymentCalculator.ProdVersion(envs);
                rows.Add(new ProductDeploymentRowDto(
                    c.Id, c.Name, c.Code, c.Status, c.IsArchived, link.Id, a.Stage, a.StageSince, a.IsOverdue, a.OverdueDays,
                    link.UsageMode, link.InstallationStartedAt, link.GoLiveAt, link.TargetGoLiveAt, link.DiscontinuedAt,
                    prodVersion,
                    IsOutdated: prodVersion is not null && product.Version is not null && prodVersion != product.Version.Trim(),
                    envs.Select(e => new DeploymentEnvironmentDto(e.Id, e.Name, e.TypeCode, e.TypeName, e.TypeColor,
                        e.PlatformName, e.DeployedVersion, e.IsActive, e.MissingRequiredCount)).ToList(),
                    DeploymentCalculator.MissingRequired(envs)));
            }
            else if (includeNonUsers && !c.IsArchived)
            {
                rows.Add(new ProductDeploymentRowDto(
                    c.Id, c.Name, c.Code, c.Status, c.IsArchived, null, DeploymentStage.NotUsed, null, false, null,
                    null, null, null, null, null, null, false, [], 0));
            }
        }

        rows = rows
            .OrderByDescending(r => r.IsOverdue)
            .ThenBy(r => DeploymentCalculator.SortRank(r.Stage))
            .ThenBy(r => r.CustomerName, StringComparer.Create(new System.Globalization.CultureInfo("tr-TR"), true))
            .ToList();

        var versions = rows.Where(r => r.ProdVersion is not null)
            .GroupBy(r => r.ProdVersion!)
            .Select(g => new VersionShareDto(g.Key, g.Count(), product.Version is not null && g.Key == product.Version.Trim()))
            .OrderByDescending(v => v.IsCurrent).ThenByDescending(v => v.CustomerCount)
            .ToList();

        var counts = Enum.GetValues<DeploymentStage>()
            .ToDictionary(s => s, s => rows.Count(r => r.Stage == s));

        return new ProductDeploymentsDto(product.Id, product.Name, product.Code, product.Version, product.ProductType,
            counts, rows.Count(r => r.IsOverdue), includeNonUsers, versions, rows);
    }
}

// ── Kurulum matrisi (tüm ürünler × tüm müşteriler) ────────────────────────

public sealed record GetDeploymentMatrixQuery : IRequest<DeploymentMatrixDto>;

public sealed class GetDeploymentMatrixQueryHandler(IDeploymentRepository repository, IScopeService scope)
    : IRequestHandler<GetDeploymentMatrixQuery, DeploymentMatrixDto>
{
    public async Task<DeploymentMatrixDto> Handle(GetDeploymentMatrixQuery request, CancellationToken ct)
    {
        if (!scope.HasGlobalReadAccess())
            throw new ForbiddenException("err.forbidden.record");

        var products = await repository.GetProductsAsync(null, ct);
        var customers = (await repository.GetCustomersAsync(ct)).Where(c => !c.IsArchived).ToList();
        var customerIds = customers.Select(c => c.Id).ToHashSet();
        var links = (await repository.GetLinksAsync(null, ct)).Where(l => customerIds.Contains(l.CustomerId)).ToList();
        var envsByLink = (await repository.GetEnvironmentsAsync(null, ct))
            .GroupBy(e => e.CustomerProductId).ToDictionary(g => g.Key, g => (IReadOnlyList<DeploymentEnvironmentRow>)g.ToList());
        var today = DeploymentCalculator.Today;

        var cells = links.Select(l =>
        {
            var envs = envsByLink.GetValueOrDefault(l.Id) ?? [];
            var a = DeploymentCalculator.Assess(l, envs, today);
            return new MatrixCellDto(l.CustomerId, l.ProductId, a.Stage, a.IsOverdue, DeploymentCalculator.ProdVersion(envs),
                DeploymentCalculator.MissingRequired(envs));
        }).ToList();

        return new DeploymentMatrixDto(
            products.Select(p => new MatrixProductDto(p.Id, p.Name, p.Code)).ToList(),
            customers.Select(c => new MatrixCustomerDto(c.Id, c.Name, c.Code, c.Status)).ToList(),
            cells);
    }
}
