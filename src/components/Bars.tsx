import { Gem, Goal, RotateCcw, Tv } from "lucide-react";
import { CATEGORIES, GEM_AD_REWARD } from "../data";
import { formatMoney } from "../game";

interface TopBarProps {
  soft: number;
  hard: number;
  totalAuto: number;
  timeWarpRemaining: number;
  adWatchedCount: number;
  onAdStats: () => void;
  onGemAd: () => void;
  onReset: () => void;
}

export function TopBar({ soft, hard, totalAuto, timeWarpRemaining, adWatchedCount, onAdStats, onGemAd, onReset }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="money-pill">
        <span className="coin">$</span>
        <span>{formatMoney(soft)}</span>
      </div>
      <div className={`income-pill ${timeWarpRemaining > 0 ? "boosted" : ""}`}>
        <span>Доход</span>
        <strong>+${formatMoney(totalAuto)}/сек</strong>
        {timeWarpRemaining > 0 && <em>x10 · {formatBoostTimer(timeWarpRemaining)}</em>}
      </div>
      <div className="top-actions">
        <div className="money-pill gem-pill">
          <Gem size={18} />
          <span>{hard}</span>
        </div>
        <button className="ad-counter-pill" type="button" title="Статистика рекламы" aria-label={`Просмотрено реклам: ${adWatchedCount}`} onClick={onAdStats}>
          <Tv size={15} />
          <span>{adWatchedCount}</span>
        </button>
        <button className="gem-ad-button" type="button" title="Реклама за гемы" aria-label="Реклама за гемы" onClick={onGemAd}>
          <Tv size={16} />
          <span>Рекл. +{GEM_AD_REWARD} 💎</span>
        </button>
        <button className="reset-button" type="button" title="Полный сброс" aria-label="Полный сброс" onClick={onReset}>
          <RotateCcw size={18} />
        </button>
      </div>
    </header>
  );
}

function formatBoostTimer(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

interface GoalBarProps {
  soft: number;
  goal: MainGoal | null;
  opening: boolean;
  onClaim: () => void;
}

export type MainGoal =
  | { kind: "money"; targetCategory: number; cost: number }
  | { kind: "final"; done: number; total: number; ready: boolean };

export function GoalBar({ soft, goal, opening, onClaim }: GoalBarProps) {
  if (!goal) {
    return (
      <section className="goal-panel complete">
        <div className="section-title"><Goal size={17} /> Игра пройдена</div>
      </section>
    );
  }
  if (goal.kind === "final") {
    const progress = goal.total > 0 ? Math.min(100, (goal.done / goal.total) * 100) : 0;
    return (
      <section className="goal-panel">
        <div className="goal-row">
          <div className="section-title">
            <Goal size={17} />
            Прокачай все бизнесы и оптимизируй их на максимум
          </div>
          {goal.ready && (
            <button className="goal-claim ready" onClick={onClaim}>
              Выполнить
            </button>
          )}
        </div>
        <div className="progress-track tall">
          <div className="goal-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="goal-caption">{goal.done} / {goal.total}</div>
      </section>
    );
  }
  const progress = Math.min(100, (soft / goal.cost) * 100);
  const ready = soft >= goal.cost && !opening;
  const showClaim = ready || opening;
  const categoryName = CATEGORIES[goal.targetCategory]?.name ?? "новую категорию";
  return (
    <section className="goal-panel">
      <div className="goal-row">
        <div className="section-title">
          <Goal size={17} />
          Арендовать землю под {categoryName}
        </div>
        {showClaim && (
          <button className={`goal-claim ${ready ? "ready" : ""}`} disabled={!ready} onClick={onClaim}>
            {opening ? "Открываем..." : "Выполнить"}
          </button>
        )}
      </div>
      <div className="progress-track tall">
        <div className="goal-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="goal-caption">${formatMoney(soft)} / ${formatMoney(goal.cost)}</div>
    </section>
  );
}
