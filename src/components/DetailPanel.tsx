import { ArrowLeft, Check, Clock, Gem, Layers, PackageCheck, Rocket, Timer, TrendingUp, Tv, UserMinus, UserPlus, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { EQUIPMENT_OPTIONS, LONG_ACTION_OPTIONS, OPTIMIZATION_COSTS, RARITY_CLASS, RARITY_NAME } from "../data";
import { effectiveIncome, expansionProgress, isRequirementDone, managerSalary, nextOptimizationBonus, nextOptimizationCost, optimizationBonus } from "../game";
import type { Business, ExpansionRequirement, ExpansionReward } from "../types";
import { BusinessLevelStars } from "./BusinessLevelStars";
import { managerEfficiencyClass } from "./managerUi";

interface DetailPanelProps {
  business: Business | null;
  soft: number;
  hard: number;
  onBuyEquipment: (id: number, requirementId: string, equipmentId: string) => void;
  onStartAction: (id: number, requirementId: string) => void;
  onExpand: (id: number) => void;
  onSkipExpansion: (id: number) => void;
  onClaimExpansionReward: (id: number, reward: ExpansionReward) => void;
  onOptimize: (id: number) => void;
  onOptimizeAd: (id: number) => void;
  onOpenAssign: (id: number) => void;
  onRemoveManager: (id: number) => void;
  onBack: () => void;
}

export function DetailPanel(props: DetailPanelProps) {
  const { business, soft, hard, onBack, onBuyEquipment, onStartAction, onExpand, onSkipExpansion, onClaimExpansionReward, onOptimize, onOptimizeAd, onOpenAssign, onRemoveManager } = props;
  const [equipmentReqId, setEquipmentReqId] = useState<string | null>(null);
  const [managerInfoOpen, setManagerInfoOpen] = useState(false);
  const [rewardPopup, setRewardPopup] = useState<(ExpansionReward & { businessName: string }) | null>(null);

  useEffect(() => {
    if (!business?.pendingExpansionReward) return;
    setRewardPopup({ ...business.pendingExpansionReward, businessName: business.name });
    onClaimExpansionReward(business.id, business.pendingExpansionReward);
  }, [business?.id, business?.pendingExpansionReward, business?.name, onClaimExpansionReward]);

  if (!business) {
    return <section className="detail-panel empty-detail"><button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Назад</button><span>Выберите бизнес.</span></section>;
  }

  const income = effectiveIncome(business);
  const progress = expansionProgress(business);
  const nextTierBusiness = { ...business, tier: business.tier + 1 };
  const nextIncome = business.maxed ? income : effectiveIncome(nextTierBusiness);
  const tierGain = Math.max(0, nextIncome - income);
  const equipmentMatch = business.requirements.find((req) => req.id === equipmentReqId);
  const equipmentReq = equipmentMatch?.type === "equipment" ? equipmentMatch : null;

  return (
    <section className="detail-panel business-page">
      <div className="business-page-head">
        <button className="back-button" onClick={onBack}><ArrowLeft size={18} /> Назад</button>
        <div className="level-badge"><BusinessLevelStars level={business.tier} /></div>
      </div>
      <DetailBlock title="Бизнес" meta={`$${income.toFixed(2)}/сек`}>
        <div className="business-summary">
          <div className="business-summary-icon">{business.icon}</div>
          <div className="min-w-0">
            <h2>{business.name}</h2>
            <div className="business-summary-text">{business.manager ? "Авто сбор" : "Ручной сбор"}</div>
          </div>
        </div>
        <BusinessInfo business={business} onHire={() => onOpenAssign(business.id)} onInfo={() => setManagerInfoOpen(true)} />
      </DetailBlock>
      <DetailBlock title="Расширение" meta={business.maxed ? "MAX" : `${progress.done}/${progress.total}`}>
        {!business.maxed ? (
          <>
          <div className="requirement-list">
            {business.requirements.map((req) => (
              <RequirementCard
                business={business}
                key={req.id}
                req={req}
                soft={soft}
                onOpenEquipment={() => setEquipmentReqId(req.id)}
                onStartAction={onStartAction}
              />
            ))}
          </div>
          <UpgradeAction business={business} progressReady={progress.ready} tierGain={tierGain} onExpand={onExpand} onSkipExpansion={onSkipExpansion} />
          {equipmentReq && (
            <EquipmentPicker
              business={business}
              req={equipmentReq}
              soft={soft}
              onBuyEquipment={onBuyEquipment}
              onClose={() => setEquipmentReqId(null)}
            />
          )}
          </>
        ) : (
          <div className="expansion-complete">Бизнес полностью расширен.</div>
        )}
      </DetailBlock>
      <DetailBlock title="Оптимизация дохода" meta={`${business.optimizationLevel}/${OPTIMIZATION_COSTS.length}`}>
        <BusinessOptimization business={business} hard={hard} onOptimize={onOptimize} onOptimizeAd={onOptimizeAd} />
      </DetailBlock>
      {managerInfoOpen && business.manager && (
        <ManagerInfoModal
          business={business}
          onClose={() => setManagerInfoOpen(false)}
          onFire={() => {
            onRemoveManager(business.id);
            setManagerInfoOpen(false);
          }}
        />
      )}
      {rewardPopup && <UpgradeRewardModal reward={rewardPopup} onClose={() => setRewardPopup(null)} />}
    </section>
  );
}

function DetailBlock({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return (
    <section className="detail-block">
      <div className="detail-block-head">
        <div>
          <strong>{title}</strong>
        </div>
        <em>{meta}</em>
      </div>
      <div className="detail-block-body">{children}</div>
    </section>
  );
}

function BusinessInfo({ business, onHire, onInfo }: { business: Business; onHire: () => void; onInfo: () => void }) {
  if (!business.manager) {
    return (
      <button className="business-manager-row empty manager-action-row" onClick={onHire}>
        <div className="empty-portrait"><UserPlus size={19} /></div>
        <div className="min-w-0">
          <div className="text-sm font-black">Нанять менеджера</div>
          <div className="text-xs font-bold text-slate-500">Выбрать из резерва или взять премиум</div>
        </div>
      </button>
    );
  }
  return (
    <button className="business-manager-row manager-action-row" onClick={onInfo}>
      <div className={`portrait sm ${RARITY_CLASS[business.manager.rarity]}`}>{business.manager.face}</div>
      <div className="min-w-0">
        <div className="text-sm font-black">{RARITY_NAME[business.manager.rarity]} менеджер</div>
        <div className={`text-xs font-bold ${managerEfficiencyClass(business.manager)}`}>Эффективность {Math.round(business.manager.efficiency * 100)}%</div>
        <div className="text-xs font-bold text-slate-500">Зарплата ${managerSalary(business, business.manager).toFixed(2)}/сек</div>
      </div>
    </button>
  );
}

function ManagerInfoModal({ business, onClose, onFire }: { business: Business; onClose: () => void; onFire: () => void }) {
  if (!business.manager) return null;
  const income = effectiveIncome(business);
  return (
    <div className="modal-overlay">
      <div className="modal-box manager-info-modal">
        <div className="row-between mb-4">
          <h2>Менеджер</h2>
          <button className="icon-quiet" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="manager-info-card">
          <div className={`portrait ${RARITY_CLASS[business.manager.rarity]}`}>{business.manager.face}</div>
          <div className="min-w-0">
            <div className="text-base font-black">{RARITY_NAME[business.manager.rarity]}</div>
            <div className={`text-sm font-bold ${managerEfficiencyClass(business.manager)}`}>Эффективность {Math.round(business.manager.efficiency * 100)}%</div>
            <div className="text-sm font-bold text-slate-500">Зарплата ${managerSalary(business, business.manager).toFixed(2)}/сек</div>
            <div className="text-sm font-bold text-emerald-300">Доход бизнеса ${income.toFixed(2)}/сек</div>
          </div>
        </div>
        <button className="primary-button danger" onClick={onFire}>
          <UserMinus size={18} /> Уволить
        </button>
      </div>
    </div>
  );
}

function UpgradeRewardModal({ reward, onClose }: { reward: ExpansionReward & { businessName: string }; onClose: () => void }) {
  const incomeGain = Math.max(0, reward.incomeAfter - reward.incomeBefore);
  return (
    <div className="modal-overlay">
      <div className="modal-box upgrade-reward-modal">
        <div className="reward-burst-icon"><Rocket size={34} /></div>
        <h2>{reward.businessName}</h2>
        <div className="reward-tier">Тир {reward.fromTier} → {reward.toTier}</div>
        <div className="reward-income-flow">
          <span>${reward.incomeBefore.toFixed(2)}/сек</span>
          <TrendingUp size={22} />
          <strong>${reward.incomeAfter.toFixed(2)}/сек</strong>
        </div>
        <div className="reward-gain">+${incomeGain.toFixed(2)}/сек дохода</div>
        <div className="reward-gem"><Gem size={22} /> +{reward.gems} гем начислен</div>
        <button className="primary-button expand" onClick={onClose}>Продолжить</button>
      </div>
    </div>
  );
}

function UpgradeAction({ business, progressReady, tierGain, onExpand, onSkipExpansion }: { business: Business; progressReady: boolean; tierGain: number; onExpand: (id: number) => void; onSkipExpansion: (id: number) => void }) {
  const active = business.expansionRemaining > 0;
  const buildPct = active && business.expansionDuration > 0 ? 100 - (business.expansionRemaining / business.expansionDuration) * 100 : 0;
  const buttonText = active
    ? `Расширение ${formatSeconds(business.expansionRemaining)}`
    : progressReady
      ? `Тир ${business.tier + 1}`
      : "Выполните условия";
  return (
    <div className="upgrade-preview">
      <div className="upgrade-preview-main">
        <strong>+${tierGain.toFixed(2)}/сек</strong>
      </div>
      {active && <div className="upgrade-build-bar"><div style={{ width: `${buildPct}%` }} /></div>}
      <button className="primary-button expand" disabled={!progressReady || active} onClick={() => onExpand(business.id)}>
        <Layers size={18} /> {buttonText}
      </button>
      {active && (
        <button className="primary-button ad" onClick={() => onSkipExpansion(business.id)}>
          <Tv size={18} /> Пропустить за рекламу
        </button>
      )}
    </div>
  );
}

function RequirementCard({ business, req, soft, onOpenEquipment, onStartAction }: { business: Business; req: ExpansionRequirement; soft: number; onOpenEquipment: () => void; onStartAction: (id: number, requirementId: string) => void }) {
  if (req.type === "work") return <WorkRequirement business={business} req={req} />;
  if (req.type === "equipment") return <EquipmentRequirement req={req} soft={soft} onOpenEquipment={onOpenEquipment} />;
  return <ActionRequirement business={business} req={req} soft={soft} onStartAction={onStartAction} />;
}

function WorkRequirement({ business, req }: { business: Business; req: Extract<ExpansionRequirement, { type: "work" }> }) {
  const done = isRequirementDone(business, req);
  const pct = Math.min(100, (business.workedSeconds / req.requiredSeconds) * 100);
  return <RequirementRow done={done} icon={<Clock size={17} />} title="EXP бизнеса" text={`EXP ${Math.floor(business.workedSeconds)} / ${req.requiredSeconds}`} progress={pct} />;
}

function EquipmentRequirement({ req, soft, onOpenEquipment }: { req: Extract<ExpansionRequirement, { type: "equipment" }>; soft: number; onOpenEquipment: () => void }) {
  const item = EQUIPMENT_OPTIONS.find((option) => option.id === req.equipmentId);
  const done = req.owned >= req.quantity;
  return (
    <RequirementRow
      done={done}
      icon={<PackageCheck size={17} />}
      title="Оборудование"
      text={`${item?.icon ?? ""} ${item?.name ?? ""}: ${req.owned}/${req.quantity} · $${req.unitCost} за шт.`}
      progress={Math.min(100, (req.owned / req.quantity) * 100)}
      action={!done && <button className="requirement-action" disabled={soft < req.unitCost} onClick={onOpenEquipment}>Выбрать</button>}
    />
  );
}

function ActionRequirement({ business, req, soft, onStartAction }: { business: Business; req: Extract<ExpansionRequirement, { type: "action" }>; soft: number; onStartAction: (id: number, requirementId: string) => void }) {
  const item = LONG_ACTION_OPTIONS.find((option) => option.id === req.actionId);
  const active = req.remaining > 0;
  const pct = active ? 100 - (req.remaining / req.duration) * 100 : req.done ? 100 : 0;
  return (
    <RequirementRow
      done={req.done}
      icon={<Timer size={17} />}
      title={item?.name ?? "Длительное действие"}
      text={req.done ? "Готово" : active ? `Осталось ${formatSeconds(req.remaining)}` : `${item?.icon ?? "⏱️"} $${req.cost} · ${formatSeconds(req.duration)}`}
      progress={pct}
      action={!req.done && !active && <button className="requirement-action" disabled={soft < req.cost} onClick={() => onStartAction(business.id, req.id)}>Начать</button>}
    />
  );
}

function RequirementRow({ done, icon, title, text, progress, action }: { done: boolean; icon: ReactNode; title: string; text: string; progress: number; action?: ReactNode }) {
  return (
    <div className={`requirement-row ${done ? "done" : ""}`}>
      <div className="requirement-state">{done ? <Check size={17} /> : icon}</div>
      <div className="requirement-main">
        <div className="requirement-row-title">{title}</div>
        <div className="requirement-text">{text}</div>
        <div className="requirement-bar"><div style={{ width: `${progress}%` }} /></div>
      </div>
      {action && <div className="requirement-row-action">{action}</div>}
    </div>
  );
}

function EquipmentPicker({ business, req, soft, onBuyEquipment, onClose }: { business: Business; req: Extract<ExpansionRequirement, { type: "equipment" }>; soft: number; onBuyEquipment: (id: number, requirementId: string, equipmentId: string) => void; onClose: () => void }) {
  const required = EQUIPMENT_OPTIONS.find((item) => item.id === req.equipmentId);
  const catalog = [
    ...EQUIPMENT_OPTIONS.filter((item) => item.id === req.equipmentId),
    ...EQUIPMENT_OPTIONS.filter((item) => item.id !== req.equipmentId),
  ];
  const done = req.owned >= req.quantity;
  return (
    <div className="modal-overlay">
      <div className="modal-box equipment-picker">
        <div className="row-between mb-3">
          <h2>Выбор оборудования</h2>
          <button className="icon-quiet" onClick={onClose} title="Закрыть"><X size={17} /></button>
        </div>
        <div className="requirement-text mb-3">Нужно: {required?.icon} {required?.name} · {req.owned}/{req.quantity}</div>
        <div className="equipment-picker-list">
          {catalog.map((item) => {
            const isRequired = item.id === req.equipmentId;
            return (
              <button className={`catalog-option ${isRequired ? "required" : ""}`} disabled={!isRequired || done || soft < req.unitCost} key={item.id} onClick={() => onBuyEquipment(business.id, req.id, item.id)}>
                <span>{item.icon}</span>
                <strong>{item.name}</strong>
                <small>{isRequired ? `$${req.unitCost}` : "не требуется"}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BusinessOptimization({ business, hard, onOptimize, onOptimizeAd }: { business: Business; hard: number; onOptimize: (id: number) => void; onOptimizeAd: (id: number) => void }) {
  const cost = nextOptimizationCost(business.optimizationLevel);
  const nextBonus = nextOptimizationBonus(business.optimizationLevel);
  const pct = (business.optimizationLevel / OPTIMIZATION_COSTS.length) * 100;
  const canUpgrade = cost != null;
  const currentBonus = optimizationBonus(business.optimizationLevel);
  const nextBusiness = canUpgrade ? { ...business, optimizationLevel: business.optimizationLevel + 1 } : business;
  const currentIncome = effectiveIncome(business);
  const nextIncome = effectiveIncome(nextBusiness);
  const incomeGain = Math.max(0, nextIncome - currentIncome);
  return (
    <div className="business-optimization">
      <div className="optimization-stats">
        <div className="optimization-stat">
          <span>Сейчас</span>
          <strong>+{Math.round(currentBonus * 100)}%</strong>
          <small>${currentIncome.toFixed(2)}/сек</small>
        </div>
        <div className={`optimization-stat ${canUpgrade ? "next" : "done"}`}>
          <span>{canUpgrade ? "Следующий" : "Максимум"}</span>
          <strong>{canUpgrade ? `+${Math.round((nextBonus ?? 0) * 100)}%` : "MAX"}</strong>
          <small>{canUpgrade ? `будет $${nextIncome.toFixed(2)}/сек` : "все уровни взяты"}</small>
        </div>
      </div>
      <div className="optimization-impact">
        {canUpgrade ? (
          <>
            <strong>Доход вырастет на ${incomeGain.toFixed(2)}/сек</strong>
            <span>${currentIncome.toFixed(2)} → ${nextIncome.toFixed(2)}/сек</span>
          </>
        ) : (
          <strong>Оптимизация на максимуме</strong>
        )}
      </div>
      <div className="progress-track"><div className="group-fill" style={{ width: `${pct}%` }} /></div>
      <div className="optimization-actions">
        <button className="primary-button expand" disabled={!canUpgrade || hard < (cost ?? 0)} onClick={() => onOptimize(business.id)}>
          <Gem size={17} /> {canUpgrade ? cost : "MAX"}
        </button>
        <button className="primary-button ad" disabled={!canUpgrade} onClick={() => onOptimizeAd(business.id)}>
          <Tv size={17} /> За рекламу
        </button>
      </div>
    </div>
  );
}

function formatSeconds(seconds: number): string {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return minutes > 0 ? `${minutes}:${rest}` : `${total} сек`;
}
