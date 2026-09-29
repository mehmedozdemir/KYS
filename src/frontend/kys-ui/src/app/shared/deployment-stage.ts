// Ürün × müşteri kurulum aşamaları (backend: Kys.Domain.Deployment.DeploymentStage).
// Renk tek başına anlam taşımaz: her aşama ikon + etiketle birlikte gösterilir.

export type DeploymentStage = 'NotUsed' | 'Planned' | 'Installing' | 'ProdReady' | 'Live' | 'Inactive' | 'Discontinued';

// İş akışı sırası (özet ve lejantlarda)
export const STAGE_ORDER: DeploymentStage[] = ['Live', 'ProdReady', 'Installing', 'Planned', 'Inactive', 'Discontinued', 'NotUsed'];

export const STAGE_META: Record<DeploymentStage, { icon: string }> = {
  Live: { icon: 'pi-check-circle' },
  ProdReady: { icon: 'pi-hourglass' },
  Installing: { icon: 'pi-cog' },
  Planned: { icon: 'pi-calendar' },
  Inactive: { icon: 'pi-pause-circle' },
  Discontinued: { icon: 'pi-times-circle' },
  NotUsed: { icon: 'pi-minus' }
};
