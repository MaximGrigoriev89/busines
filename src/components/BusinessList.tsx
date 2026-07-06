import { Check, UserPlus } from "lucide-react";
import { CATEGORIES, COLLECT_TIME, RARITY_CLASS, RARITY_NAME, STAT_FULL } from "../data";
import { effectiveIncome, formatMoney } from "../game";
import type { Business, Manager } from "../types";

interface IncomeBurst {
  id: number;
  businessId: number;
  amount: number;
  mode: "manual" | "auto";
}

interface BusinessListProps {
  businesses: Business[];
  activeCategory: number;
  selectedId: number | null;
  groupLevels: number[];
  hasFreeManager: boolean;
  hasStoredManager: boolean;
  incomeBursts: IncomeBurst[];
  onSelect: (id: number) => void;
  onCollect: (id: number) => void;
  onOpenAssign: (id: number) => void;
  onRemoveManager: (id: number) => void;
}

export function BusinessList(props: BusinessListProps) {
  const items = props.businesses.filter((business) => business.catIdx === props.activeCategory);
  return (
    <section className="business-list">
      {items.map((business) => (
        <BusinessCard key={business.id} business={business} {...props} />
      ))}
    </section>
  );
}

function BusinessCard(props: BusinessListProps & { business: Business }) {
  const { business, businesses, selectedId, groupLevels, hasFreeManager, hasStoredManager, incomeBursts, onSelect, onCollect, onOpenAssign, onRemoveManager } = props;
  const income = effectiveIncome(business, businesses, groupLevels);
  const tier = business.maxed ? "MAX" : `T${business.tier}/4 · ${business.upCnt}/5`;
  const bursts = incomeBursts.filter((burst) => burst.businessId === business.id);
  return (
    <article className={`business-card ${selectedId === business.id ? "selected" : ""} ${business.manager ? "auto-active" : ""}`} onClick={() => onSelect(business.id)}>
      <div className="biz-icon">{business.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="category-label">{CATEGORIES[business.catIdx].name}</div>
        <h3 className="truncate text-lg font-black">{business.name}</h3>
        <div className="text-sm font-extrabold text-emerald-300">${income.toFixed(1)}/сек</div>
        <div className="text-xs font-bold text-slate-500">{tier}</div>
        <BusinessProgress business={business} />
      </div>
      {business.manager ? (
        <ManagerBadge manager={business.manager} onRemove={() => onRemoveManager(business.id)} />
      ) : (
        <CollectAction business={business} hasStoredManager={hasStoredManager} onCollect={onCollect} onOpenAssign={onOpenAssign} />
      )}
      {!hasFreeManager && business.manager && <div className="absolute right-3 top-3 text-[10px] font-black text-red-300">мест нет</div>}
      <IncomeBursts bursts={bursts} />
    </article>
  );
}

function BusinessProgress({ business }: { business: Business }) {
  if (business.manager) {
    return <div className="business-progress auto"><div className="business-progress-fill" /><span>Авто сбор</span></div>;
  }
  const progress = Math.min(100, (business.collectTimer / COLLECT_TIME) * 100);
  return (
    <div className={`business-progress ${business.collectReady ? "ready" : ""}`}>
      <div className="business-progress-fill" style={{ width: `${progress}%` }} />
      <span>{business.collectReady ? "Готово к сбору" : `Сбор ${Math.floor(progress)}%`}</span>
    </div>
  );
}

function CollectAction({ business, hasStoredManager, onCollect, onOpenAssign }: { business: Business; hasStoredManager: boolean; onCollect: (id: number) => void; onOpenAssign: (id: number) => void }) {
  const progress = Math.min(100, (business.collectTimer / COLLECT_TIME) * 100);
  if (business.collectReady) {
    return <button className="collect-ready" onClick={(event) => { event.stopPropagation(); onCollect(business.id); }}>$$$</button>;
  }
  if (hasStoredManager) {
    return <button className="assign-button" onClick={(event) => { event.stopPropagation(); onOpenAssign(business.id); }}><UserPlus size={19} /></button>;
  }
  return <div className="collect-ring" style={{ background: `conic-gradient(#38bdf8 ${progress}%, #202747 ${progress}%)` }} />;
}

function ManagerBadge({ manager, onRemove }: { manager: Manager; onRemove: () => void }) {
  const full = manager.stat ? STAT_FULL[manager.stat] : "Без особых способностей";
  return (
    <div className="manager-badge">
      <div className={`portrait sm ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-black">{RARITY_NAME[manager.rarity]}</div>
        <div className="truncate text-xs font-bold text-slate-300">{manager.desc || full}</div>
      </div>
      <button className="icon-quiet" onClick={(event) => { event.stopPropagation(); onRemove(); }} title="Убрать менеджера">
        <Check size={15} />
      </button>
    </div>
  );
}

function IncomeBursts({ bursts }: { bursts: IncomeBurst[] }) {
  return (
    <>
      {bursts.map((burst) => (
        <div className={`income-burst ${burst.mode}`} key={burst.id}>+${formatMoney(burst.amount)}</div>
      ))}
    </>
  );
}
