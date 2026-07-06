import { Clock, Rocket } from "lucide-react";
import { UPGRADE_NAMES } from "../data";
import { effectiveIncome, upgradeCost } from "../game";
import type { Business } from "../types";

interface DetailPanelProps {
  business: Business | null;
  businesses: Business[];
  groupLevels: number[];
  soft: number;
  onBuyUpgrade: (id: number) => void;
  onSkipTimer: (id: number) => void;
  onExpand: (id: number) => void;
}

export function DetailPanel({ business, businesses, groupLevels, soft, onBuyUpgrade, onSkipTimer, onExpand }: DetailPanelProps) {
  if (!business) {
    return (
      <section className="detail-panel empty-detail">
        <span>Выберите бизнес, чтобы прокачивать его и смотреть доход.</span>
      </section>
    );
  }

  const cost = upgradeCost(business);
  const income = effectiveIncome(business, businesses, groupLevels);
  const tierTitle = business.maxed ? "МАКС" : `Тир ${business.tier}/4`;

  return (
    <section className="detail-panel">
      <div className="row-between mb-3">
        <h2>{business.icon} {business.name}</h2>
        <div className="level-badge">{tierTitle}</div>
      </div>
      <div className="mb-4 text-sm font-bold text-emerald-300">
        Доход: ${income.toFixed(2)}/сек {business.manager ? "(авто)" : "(ручной сбор)"}
      </div>
      <div className="upgrade-list">
        {UPGRADE_NAMES.map((name, index) => (
          <div className="upgrade-row" key={name}>
            <span>{name}</span>
            <span className={business.ups[index] ? "upgrade-check on" : "upgrade-check"}>{business.ups[index] ? "✓" : ""}</span>
          </div>
        ))}
      </div>
      <DetailAction business={business} cost={cost} soft={soft} onBuyUpgrade={onBuyUpgrade} onSkipTimer={onSkipTimer} onExpand={onExpand} />
    </section>
  );
}

function DetailAction({ business, cost, soft, onBuyUpgrade, onSkipTimer, onExpand }: { business: Business; cost: number; soft: number; onBuyUpgrade: (id: number) => void; onSkipTimer: (id: number) => void; onExpand: (id: number) => void }) {
  if (business.maxed) return <button className="primary-button muted" disabled>⭐ Бизнес на максимуме</button>;
  if (business.upCnt < 5) {
    return (
      <button className="primary-button buy" disabled={soft < cost} onClick={() => onBuyUpgrade(business.id)}>
        Купить улучшение — ${cost}
      </button>
    );
  }
  if (business.tierActive && !business.tierDone) {
    const rem = Math.max(0, Math.ceil(business.tierTimer));
    const mm = Math.floor(rem / 60);
    const ss = String(rem % 60).padStart(2, "0");
    return (
      <>
        <div className="timer-row"><Clock size={16} /> Расширение через {mm}:{ss}</div>
        <button className="primary-button ad" onClick={() => onSkipTimer(business.id)}>📺 Пропустить за рекламу</button>
      </>
    );
  }
  if (business.tierDone) {
    return <button className="primary-button expand" onClick={() => onExpand(business.id)}><Rocket size={18} /> Расширить до тира {business.tier + 1}</button>;
  }
  return <button className="primary-button muted" disabled>Все улучшения куплены</button>;
}
