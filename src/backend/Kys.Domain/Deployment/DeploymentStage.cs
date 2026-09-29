using Kys.Domain.Enumerations;

namespace Kys.Domain.Deployment;

/// <summary>Bir ürünün bir müşterideki kurulum aşaması (mevcut kayıtlardan türetilir, saklanmaz).</summary>
public enum DeploymentStage
{
    NotUsed,        // müşteri ürünü kullanmıyor
    Planned,        // ilişki var, henüz ortam yok
    Installing,     // yalnızca production dışı ortamlar (Test/UAT/Pre-Prod)
    ProdReady,      // Prod ortamı var ama henüz canlıya geçilmedi
    Live,           // canlı
    Inactive,       // pasif
    Discontinued    // kullanım sonlandı
}

/// <summary>Aşama türetme için gereken müşteri-ürün bilgisi.</summary>
public sealed record DeploymentFacts(
    UsageMode UsageMode,
    CustomerProductStatus Status,
    bool HasNonProdEnvironment,
    bool HasProdEnvironment,
    DateOnly? CreatedOn,
    DateOnly? InstallationStartedAt,
    DateOnly? TestReadyAt,
    DateOnly? ProdReadyAt,
    DateOnly? GoLiveAt,
    DateOnly? TargetGoLiveAt,
    DateOnly? DiscontinuedAt);

public sealed record DeploymentAssessment(
    DeploymentStage Stage,
    DateOnly? StageSince,
    bool IsOverdue,
    int? OverdueDays);

public static class DeploymentStageResolver
{
    public static DeploymentAssessment NotUsed { get; } = new(DeploymentStage.NotUsed, null, false, null);

    public static DeploymentAssessment Assess(DeploymentFacts f, DateOnly today)
    {
        var stage = f.Status switch
        {
            CustomerProductStatus.Discontinued => DeploymentStage.Discontinued,
            CustomerProductStatus.Inactive => DeploymentStage.Inactive,
            CustomerProductStatus.Active => DeploymentStage.Live,
            // Devreye alma: ortam durumuna göre ayrıştırılır. SaaS'ta ortam yoktur → Planlandı.
            _ when f.UsageMode == UsageMode.SaaS => DeploymentStage.Planned,
            _ when f.HasProdEnvironment => DeploymentStage.ProdReady,
            _ when f.HasNonProdEnvironment => DeploymentStage.Installing,
            _ => DeploymentStage.Planned
        };

        var since = stage switch
        {
            DeploymentStage.Planned => f.CreatedOn,
            DeploymentStage.Installing => f.TestReadyAt ?? f.InstallationStartedAt ?? f.CreatedOn,
            DeploymentStage.ProdReady => f.ProdReadyAt ?? f.InstallationStartedAt,
            DeploymentStage.Live => f.GoLiveAt,
            DeploymentStage.Discontinued => f.DiscontinuedAt,
            _ => null
        };

        // Gecikme: hedef tarih geçmiş ama henüz canlıya geçilmemiş (devreye alma aşamalarında)
        var inProgress = stage is DeploymentStage.Planned or DeploymentStage.Installing or DeploymentStage.ProdReady;
        var overdue = inProgress && f.TargetGoLiveAt is { } target && target < today;
        int? overdueDays = overdue ? today.DayNumber - f.TargetGoLiveAt!.Value.DayNumber : null;

        return new DeploymentAssessment(stage, since, overdue, overdueDays);
    }
}
