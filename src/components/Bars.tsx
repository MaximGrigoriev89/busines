import { BriefcaseBusiness, Gem, Goal, TrendingUp } from "lucide-react";
import { CATEGORIES, GROUP_COSTS, MONEY_GOAL } from "../data";
import { formatMoney, nextGroupCost } from "../game";

interface TopBarProps {
  soft: number;
  hard: number;
  totalAuto: number;
}

export function TopBar({ soft, hard, totalAuto }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="money-pill">
        <span className="coin">$</span>
        <span>{formatMoney(soft)}</span>
      </div>
      <div className="text-center">
        <div className="app-title">Бизнес Империя</div>
        <div className="income-line">+${formatMoney(totalAuto)}/сек</div>
      </div>
      <div className="money-pill">
        <Gem size={18} />
        <span>{hard}</span>
      </div>
    </header>
  );
}

export function GoalBar({ soft }: { soft: number }) {
  const progress = Math.min(100, (soft / MONEY_GOAL) * 100);
  return (
    <section className="goal-panel">
      <div className="row-between">
        <div className="section-title">
          <Goal size={17} />
          Цель: $1 000 000
        </div>
        <strong>${formatMoney(soft)} / $1M</strong>
      </div>
      <div className="progress-track tall">
        <div className="goal-fill" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

interface GroupOptimizationProps {
  activeCategory: number;
  groupLevels: number[];
  hard: number;
  onInvest: () => void;
}

export function GroupOptimization({ activeCategory, groupLevels, hard, onInvest }: GroupOptimizationProps) {
  const level = groupLevels[activeCategory] || 0;
  const cost = nextGroupCost(level);
  const progress = (level / GROUP_COSTS.length) * 100;
  return (
    <footer className="group-opt">
      <div className="row-between mb-3">
        <div className="section-title">
          <TrendingUp size={17} />
          Оптимизация: {CATEGORIES[activeCategory].name}
        </div>
        <div className="level-badge">{level}/5</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="progress-track">
            <div className="group-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-bold text-slate-500">
            <span>+5%</span><span>+10%</span><span>+15%</span><span>+20%</span><span>+25%</span>
          </div>
        </div>
        <button className="invest-button" disabled={cost == null || hard < cost} onClick={onInvest}>
          {cost == null ? (
            <>Макс</>
          ) : (
            <>
              <BriefcaseBusiness size={16} />
              {cost} 💎
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
