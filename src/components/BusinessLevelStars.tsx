import { MAX_BUSINESS_TIER } from "../data";
import { businessTierVisualForTier } from "../businessTierVisual";

export function BusinessLevelStars({ level, compact = false }: { level: number; compact?: boolean }) {
  const stars = Math.min(MAX_BUSINESS_TIER, Math.max(1, Math.floor(level)));
  const visual = businessTierVisualForTier(level);
  if (compact) {
    return (
      <div className={`business-level-stars condition-${visual.tone} compact`} aria-label={`Уровень бизнеса ${stars}`}>
        <span className="condition-star-count" aria-hidden="true">
          {Array.from({ length: stars }, () => "★").join("")}
        </span>
      </div>
    );
  }
  return (
    <div className={`business-level-stars condition-${visual.tone}`} aria-label={`Уровень бизнеса ${stars}`}>
      <span className="condition-pips" aria-hidden="true">
        {Array.from({ length: MAX_BUSINESS_TIER }, (_, index) => (
          <i className={index < stars ? "filled" : ""} key={index} />
        ))}
      </span>
      <span>Ур. {stars}</span>
    </div>
  );
}
