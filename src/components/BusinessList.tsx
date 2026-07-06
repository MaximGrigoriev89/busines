import { Building2, Check, Clock, Info, Lock, Tv, UserPlus } from "lucide-react";
import { COLLECT_TIME, OPTIMIZATION_COSTS, RARITY_CLASS, RARITY_NAME } from "../data";
import { effectiveIncome, formatMoney, optimizationBonus } from "../game";
import { businessNotifications } from "../notifications";
import { BusinessLevelStars } from "./BusinessLevelStars";
import type { BusinessNotification } from "../notifications";
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
  soft: number;
  hasFreeManager: boolean;
  hasStoredManager: boolean;
  incomeBursts: IncomeBurst[];
  onSelect: (id: number) => void;
  onCollect: (id: number) => void;
  onOpenAssign: (id: number) => void;
  onRemoveManager: (id: number) => void;
  onOpenBusiness: (id: number) => void;
  onSkipUnlock: (id: number) => void;
}

export function BusinessList(props: BusinessListProps) {
  const items = props.businesses.filter((business) => business.catIdx === props.activeCategory);
  return (
    <section className="business-list-panel">
      <div className="business-list-head">
        <div className="business-list-title">
          <div className="section-title">Бизнесы</div>
          <CategoryStarProgress businesses={items} />
        </div>
      </div>
      <div className="business-list">
        {items.map((business) => (
          <BusinessCard key={business.id} business={business} {...props} />
        ))}
      </div>
    </section>
  );
}

function CategoryStarProgress({ businesses }: { businesses: Business[] }) {
  const maxBusinessLevels = 3;
  const maxOptimizationLevels = OPTIMIZATION_COSTS.length;
  const levelDone = businesses.reduce((sum, business) => sum + (business.opened ? Math.min(maxBusinessLevels, business.tier) : 0), 0);
  const optimizationDone = businesses.reduce((sum, business) => sum + (business.opened ? business.optimizationLevel : 0), 0);
  return (
    <div className="category-star-progress" aria-label={`Прогресс категории: уровни ${levelDone}, оптимизация ${optimizationDone}`}>
      <StarProgressRow label="Уровни" businesses={businesses} max={maxBusinessLevels} value={(business) => (business.opened ? business.tier : 0)} />
      <StarProgressRow label="Оптимизация" businesses={businesses} max={maxOptimizationLevels} value={(business) => (business.opened ? business.optimizationLevel : 0)} />
    </div>
  );
}

function StarProgressRow({ label, businesses, max, value }: { label: string; businesses: Business[]; max: number; value: (business: Business) => number }) {
  return (
    <div className="category-star-row">
      <span>{label}</span>
      <div className="category-star-groups">
        {businesses.map((business) => (
          <div className="category-star-group" key={business.id} title={business.name}>
            {Array.from({ length: max }, (_, index) => (
              <span className={index < value(business) ? "category-star filled" : "category-star"} key={index}>
                {index < value(business) ? "★" : "☆"}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessCard(props: BusinessListProps & { business: Business }) {
  const { business, soft, hasFreeManager, hasStoredManager, incomeBursts, onSelect, onCollect, onOpenAssign, onRemoveManager, onOpenBusiness, onSkipUnlock } = props;
  if (!business.opened) {
    return <LockedBusinessCard business={business} soft={soft} onOpenBusiness={onOpenBusiness} onSkipUnlock={onSkipUnlock} />;
  }

  const income = effectiveIncome(business);
  const manualCollect = income * COLLECT_TIME;
  const bursts = incomeBursts.filter((burst) => burst.businessId === business.id);
  const readyToCollect = !business.manager && business.collectReady;
  const statusClass = business.manager ? "auto" : readyToCollect ? "ready" : "manual";
  const statusText = business.manager ? "Авто" : readyToCollect ? "Готово" : "Ручной";
  const optBonus = optimizationBonus(business.optimizationLevel);
  const notifications = businessNotifications(business, soft);
  const handleCardClick = () => {
    if (readyToCollect) onCollect(business.id);
    else onSelect(business.id);
  };
  return (
    <article className={`business-card ${business.manager ? "auto-active" : ""} ${readyToCollect ? "collectable" : ""}`} onClick={handleCardClick}>
      <BusinessNotificationBadges notifications={notifications} />
      <div className="biz-icon">{business.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="business-card-head">
          <h3 className="truncate text-lg font-black">{business.name}</h3>
          <BusinessLevelStars level={business.tier} compact />
          <span className={`status-pill ${statusClass}`}>{statusText}</span>
          {optBonus > 0 && <span className="optimization-badge">+{Math.round(optBonus * 100)}%</span>}
        </div>
        <div className="business-card-meta">
          <span>
            <small>Доход</small>
            <strong>${income.toFixed(1)}/сек</strong>
          </span>
        </div>
        <BusinessProgress business={business} collectAmount={manualCollect} />
      </div>
      <div className="business-card-side">
        {business.manager ? (
          <ManagerBadge manager={business.manager} onRemove={() => onRemoveManager(business.id)} />
        ) : (
          <ManagerFrame isCollectable={readyToCollect} hasStoredManager={hasStoredManager} onOpenAssign={() => onOpenAssign(business.id)} />
        )}
        <button
          className="business-card-open"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(business.id);
          }}
          title="Открыть бизнес"
        >
          <Info size={18} />
        </button>
      </div>
      {!hasFreeManager && business.manager && <div className="absolute right-3 top-3 text-[10px] font-black text-red-300">мест нет</div>}
      <IncomeBursts bursts={bursts} />
    </article>
  );
}

function LockedBusinessCard({ business, soft, onOpenBusiness, onSkipUnlock }: { business: Business; soft: number; onOpenBusiness: (id: number) => void; onSkipUnlock: (id: number) => void }) {
  const waitingPrevious = business.unlockRemaining == null;
  const waitingTimer = business.unlockRemaining != null && business.unlockRemaining > 0;
  const ready = business.unlockRemaining === 0;
  const canOpen = ready && soft >= business.openCost;
  const notifications = businessNotifications(business, soft);
  const lockText = waitingPrevious
    ? "После предыдущего бизнеса"
    : waitingTimer
      ? `Откроется через ${formatTime(business.unlockRemaining ?? 0)}`
      : `Цена $${formatMoney(business.openCost)}`;
  return (
    <article className={`business-card locked ${ready ? "unlock-ready" : ""}`}>
      <BusinessNotificationBadges notifications={notifications} />
      <div className="biz-icon locked-icon"><Lock size={24} /></div>
      <div className="min-w-0 flex-1">
        <div className="business-card-head">
          <h3 className="truncate text-lg font-black">{business.name}</h3>
          <span className="status-pill manual">{ready ? "Доступен" : waitingTimer ? "Таймер" : "Закрыт"}</span>
        </div>
        <div className="locked-business-line">{canOpen ? "Можно открыть" : lockText}</div>
      </div>
      <div className="business-card-side">
        {waitingTimer ? (
          <button className="business-open-action ad" onClick={(event) => { event.stopPropagation(); onSkipUnlock(business.id); }} title="Пропустить ожидание за рекламу">
            <Tv size={18} />
            <span>Skip</span>
          </button>
        ) : (
          <button className="business-open-action" disabled={!canOpen} onClick={(event) => { event.stopPropagation(); onOpenBusiness(business.id); }} title="Открыть бизнес">
            <Building2 size={18} />
            <span>Open</span>
          </button>
        )}
        {waitingTimer && <Clock size={16} className="business-card-arrow" />}
      </div>
    </article>
  );
}

function BusinessNotificationBadges({ notifications }: { notifications: BusinessNotification[] }) {
  if (notifications.length === 0) return null;
  const priority: BusinessNotification["tone"][] = ["reward", "open", "upgrade"];
  const tone = priority.find((item) => notifications.some((notification) => notification.tone === item)) ?? notifications[0].tone;
  return (
    <div className={`business-notifications ${tone}`} aria-label={`Доступно действий: ${notifications.length}`}>
      <span className="business-notification">{notifications.length > 1 ? notifications.length : ""}</span>
    </div>
  );
}

function BusinessProgress({ business, collectAmount }: { business: Business; collectAmount: number }) {
  if (business.manager) {
    return <div className="business-progress auto"><div className="business-progress-fill" /><span>Авто сбор</span></div>;
  }
  const progress = Math.min(100, (business.collectTimer / COLLECT_TIME) * 100);
  return (
    <div className={`business-progress ${business.collectReady ? "ready" : ""}`}>
      <div className="business-progress-fill" style={{ width: `${progress}%` }} />
      {business.collectReady && <span>Нажмите: +${formatMoney(collectAmount)}</span>}
    </div>
  );
}

function ManagerFrame({ isCollectable, hasStoredManager, onOpenAssign }: { isCollectable: boolean; hasStoredManager: boolean; onOpenAssign: () => void }) {
  if (isCollectable) {
    return <div className="manager-frame collectable"><span className="manager-frame-icon">👤</span><small>$$$</small></div>;
  }
  return (
    <button className="manager-frame action" onClick={(event) => { event.stopPropagation(); onOpenAssign(); }} title="Назначить менеджера">
      <UserPlus size={20} />
      <span>{hasStoredManager ? "Назначить" : "Найти"}</span>
    </button>
  );
}

function ManagerBadge({ manager, onRemove }: { manager: Manager; onRemove: () => void }) {
  return (
    <div className="manager-badge">
      <div className={`portrait sm ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
      <div className="manager-badge-text">
        <div className="truncate text-sm font-black">{RARITY_NAME[manager.rarity]}</div>
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

function formatTime(seconds: number): string {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}
