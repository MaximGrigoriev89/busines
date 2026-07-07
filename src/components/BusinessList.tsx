import { Building2, Clock, DollarSign, Info, Lock, Star, Tv, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { businessArtForBusiness } from "../businessArt";
import { CATEGORIES, COLLECT_TIME, MAX_BUSINESS_TIER, OPTIMIZATION_COSTS, RARITY_CLASS, RARITY_NAME } from "../data";
import { effectiveIncome, formatMoney, isHoldingCategory, sourceCategoryIndexForHoldingBusiness } from "../game";
import { businessNotifications } from "../notifications";
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
  const title = isHoldingCategory(props.activeCategory) ? "Холдинги" : "Бизнесы";
  return (
    <section className="business-list-panel">
      <div className="business-list-head">
        <div className="business-list-title">
          <div className="section-title">{title}</div>
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

function BusinessCard(props: BusinessListProps & { business: Business }) {
  const { business, selectedId, soft, incomeBursts, onSelect, onCollect, onOpenAssign, onOpenBusiness, onSkipUnlock } = props;
  if (!business.opened) {
    return <LockedBusinessCard business={business} soft={soft} onOpenBusiness={onOpenBusiness} onSkipUnlock={onSkipUnlock} />;
  }

  const income = effectiveIncome(business);
  const manualCollect = income * COLLECT_TIME;
  const merged = business.mergedIntoHolding;
  const bursts = incomeBursts.filter((burst) => burst.businessId === business.id);
  const readyToCollect = !merged && !business.manager && business.collectReady;
  const notifications = businessNotifications(business, soft);
  const art = businessArtForBusiness(business);
  const handleCardClick = () => {
    if (readyToCollect) onCollect(business.id);
    else onSelect(business.id);
  };
  return (
    <article className={`business-card ${business.manager && !merged ? "auto-active" : ""} ${readyToCollect ? "collectable" : ""} ${selectedId === business.id ? "selected" : ""} ${merged ? "merged-business" : ""}`} onClick={handleCardClick}>
      <BusinessNotificationBadges notifications={notifications} />
      {art ? (
        <div className="biz-art-thumb">
          <img className="business-placeholder-art" src={art} alt={business.name} />
        </div>
      ) : (
        <div className="biz-icon">{business.icon}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="business-card-head">
          <h3 className="business-card-title">{business.name}</h3>
          <div className="business-card-badges">
            {merged && <span className="status-pill merged">Холдинг</span>}
          </div>
        </div>
        <BusinessStarProgress business={business} />
        {!merged && (
          <div className="business-card-meta">
            <span>
              <strong>${income.toFixed(1)}/сек</strong>
            </span>
          </div>
        )}
        <BusinessProgress business={business} collectAmount={manualCollect} />
      </div>
      <div className="business-card-side">
        {business.manager ? (
          <ManagerBadge manager={business.manager} />
        ) : readyToCollect ? (
          <CollectFrame amount={manualCollect} onCollect={() => onCollect(business.id)} />
        ) : (
          <ManagerFrame onOpenAssign={() => onOpenAssign(business.id)} />
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
      <IncomeBursts bursts={bursts} />
    </article>
  );
}

function BusinessStarProgress({ business }: { business: Business }) {
  const levelDone = Math.min(MAX_BUSINESS_TIER, business.tier);
  const optimizationDone = Math.min(OPTIMIZATION_COSTS.length, business.optimizationLevel);
  const done = levelDone + optimizationDone;
  const total = MAX_BUSINESS_TIER + OPTIMIZATION_COSTS.length;
  const previous = useRef({ levelDone, optimizationDone });
  const [awardedStars, setAwardedStars] = useState<{ level: number[]; optimization: number[] }>({ level: [], optimization: [] });

  useEffect(() => {
    const addedLevel = indexesBetween(previous.current.levelDone, levelDone);
    const addedOptimization = indexesBetween(previous.current.optimizationDone, optimizationDone);
    previous.current = { levelDone, optimizationDone };

    if (addedLevel.length === 0 && addedOptimization.length === 0) return;

    setAwardedStars({ level: addedLevel, optimization: addedOptimization });
    const timeout = window.setTimeout(() => {
      setAwardedStars({ level: [], optimization: [] });
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [levelDone, optimizationDone]);

  return (
    <div className="business-stars-progress" aria-label={`Звезды бизнеса ${done} из ${total}`}>
      <div className="business-star-track">
        <BusinessStarGroup total={MAX_BUSINESS_TIER} filled={levelDone} label="Уровни" awarded={awardedStars.level} />
        <BusinessStarGroup total={OPTIMIZATION_COSTS.length} filled={optimizationDone} label="Оптимизация" awarded={awardedStars.optimization} />
      </div>
    </div>
  );
}

function BusinessStarGroup({ total, filled, label, awarded }: { total: number; filled: number; label: string; awarded: number[] }) {
  return (
    <div className="business-star-group" title={`${label}: ${filled}/${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <Star className={`business-star ${index < filled ? "filled" : ""} ${awarded.includes(index) ? "awarded" : ""}`} fill="currentColor" size={11} key={index} />
      ))}
    </div>
  );
}

function indexesBetween(from: number, to: number): number[] {
  if (to <= from) return [];
  return Array.from({ length: to - from }, (_, index) => from + index);
}

function LockedBusinessCard({ business, soft, onOpenBusiness, onSkipUnlock }: { business: Business; soft: number; onOpenBusiness: (id: number) => void; onSkipUnlock: (id: number) => void }) {
  const waitingPrevious = business.unlockRemaining == null;
  const waitingTimer = business.unlockRemaining != null && business.unlockRemaining > 0;
  const ready = business.unlockRemaining === 0;
  const holdingSourceCategory = sourceCategoryIndexForHoldingBusiness(business);
  const waitingHoldingMerge = holdingSourceCategory != null && !ready;
  const hidden = !ready;
  const canOpen = ready && soft >= business.openCost;
  const notifications = businessNotifications(business, soft);
  const art = businessArtForBusiness(business);
  const lockText = waitingHoldingMerge
    ? `Нужно слияние: ${CATEGORIES[holdingSourceCategory]?.name ?? "группа"}`
    : waitingPrevious
    ? "После предыдущего бизнеса"
    : waitingTimer
      ? `Откроется через ${formatTime(business.unlockRemaining ?? 0)}`
      : `Цена $${formatMoney(business.openCost)}`;
  return (
    <article className={`business-card locked ${ready ? "unlock-ready" : ""}`}>
      <BusinessNotificationBadges notifications={notifications} />
      {hidden ? (
        <div className="biz-icon locked-icon"><Lock size={24} /></div>
      ) : art ? (
        <div className="biz-art-thumb locked-art">
          <img className="business-placeholder-art" src={art} alt={business.name} />
        </div>
      ) : (
        <div className="biz-icon locked-icon"><Lock size={24} /></div>
      )}
      <div className="min-w-0 flex-1">
        <div className="business-card-head">
          <h3 className="business-card-title">{hidden ? "???" : business.name}</h3>
          <div className="business-card-badges">
            <span className="status-pill manual">{ready ? "Доступен" : waitingHoldingMerge ? "Слияние" : waitingTimer ? "Таймер" : "Закрыт"}</span>
          </div>
        </div>
        <div className="locked-business-line">{canOpen ? "Можно открыть" : lockText}</div>
      </div>
      <div className="business-card-side">
        {waitingHoldingMerge ? (
          <Lock size={18} className="business-card-arrow" />
        ) : waitingTimer ? (
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
  if (business.mergedIntoHolding) {
    return <div className="business-progress merged"><div className="business-progress-fill" /><span>Вошел в холдинг</span></div>;
  }
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

function ManagerFrame({ onOpenAssign }: { onOpenAssign: () => void }) {
  return (
    <button className="manager-frame action" onClick={(event) => { event.stopPropagation(); onOpenAssign(); }} title="Назначить менеджера">
      <UserPlus size={20} />
      <span>Менеджер</span>
    </button>
  );
}

function CollectFrame({ amount, onCollect }: { amount: number; onCollect: () => void }) {
  return (
    <button className="manager-frame collectable collect-frame" onClick={(event) => { event.stopPropagation(); onCollect(); }} title="Собрать доход">
      <DollarSign size={20} />
      <span>Собрать</span>
      <small>+${formatMoney(amount)}</small>
    </button>
  );
}

function ManagerBadge({ manager }: { manager: Manager }) {
  return (
    <div className="manager-badge">
      <div className={`portrait sm ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
      <div className="manager-badge-text">
        <div className="manager-card-name">{RARITY_NAME[manager.rarity]}</div>
      </div>
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
