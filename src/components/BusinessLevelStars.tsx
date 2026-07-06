import { Star } from "lucide-react";

export function BusinessLevelStars({ level, compact = false }: { level: number; compact?: boolean }) {
  const stars = Math.max(1, Math.floor(level));
  return (
    <div className={`business-level-stars ${compact ? "compact" : ""}`} aria-label={`Уровень бизнеса ${stars}`}>
      {Array.from({ length: stars }, (_, index) => (
        <Star key={index} size={compact ? 12 : 15} fill="currentColor" />
      ))}
      {!compact && <span>Ур. {stars}</span>}
    </div>
  );
}
