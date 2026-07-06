export type BusinessTierTone = "broken" | "assembled" | "enhanced";

export interface BusinessTierVisual {
  stage: 1 | 2 | 3;
  label: string;
  short: string;
  tone: BusinessTierTone;
}

export function businessTierVisualForTier(tier: number): BusinessTierVisual {
  const safeTier = Math.max(1, Math.floor(tier));
  if (safeTier <= 1) {
    return { stage: 1, label: `Ур. ${safeTier}`, short: "Старт", tone: "broken" };
  }
  if (safeTier === 2) {
    return { stage: 2, label: `Ур. ${safeTier}`, short: "Рост", tone: "assembled" };
  }
  return { stage: 3, label: `Ур. ${safeTier}`, short: "Масштаб", tone: "enhanced" };
}
