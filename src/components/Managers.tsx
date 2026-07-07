import { Gem, Search, UserMinus } from "lucide-react";
import { useState } from "react";
import { PREMIUM_MANAGER_COST, RARITY_CLASS, RARITY_NAME } from "../data";
import type { Manager } from "../types";
import { managerEfficiencyClass, managerIncomeDeltaLabel } from "./managerUi";

interface ManagersProps {
  managers: Array<Manager | null>;
  premiumManager: Manager;
  managerCooldown: number;
  onSearch: (slot: number) => void;
  onFire: (slot: number) => void;
}

export function Managers({ managers, premiumManager, managerCooldown, onSearch, onFire }: ManagersProps) {
  const hireLabel = managerCooldown <= 0 ? "готов" : `реклама / ${formatTimer(managerCooldown)}`;
  const [info, setInfo] = useState<{ manager: Manager; slot: number | null; premium: boolean } | null>(null);

  return (
    <section className="panel">
      <div className="row-between mb-3">
        <div className="section-title">Резерв менеджеров</div>
      </div>
      <div className="manager-bench">
        {managers.map((manager, slot) => (
          <div className="manager-slot" key={slot}>
            {manager ? (
              <ManagerCard manager={manager} onInfo={() => setInfo({ manager, slot, premium: false })} />
            ) : (
              <button className="empty-manager" onClick={() => onSearch(slot)}>
                <Search size={22} />
                <span>Искать</span>
                <small>{hireLabel}</small>
              </button>
            )}
          </div>
        ))}
        <div className="manager-slot premium-slot">
          <PremiumManagerCard
            manager={premiumManager}
            label={`${PREMIUM_MANAGER_COST} 💎`}
            onInfo={() => setInfo({ manager: premiumManager, slot: null, premium: true })}
          />
        </div>
      </div>
      {info && (
        <ManagerBenchInfo
          info={info}
          onClose={() => setInfo(null)}
          onFire={() => {
            if (info.slot != null) onFire(info.slot);
            setInfo(null);
          }}
        />
      )}
    </section>
  );
}

function ManagerCard({ manager, onInfo }: { manager: Manager; onInfo: () => void }) {
  return (
    <button className="manager-card compact-manager-card" onClick={onInfo}>
      <div className={`portrait sm ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
      <strong className={managerEfficiencyClass(manager)}>{managerIncomeDeltaLabel(manager)}</strong>
      <small>x{manager.salary.toFixed(2)}</small>
    </button>
  );
}

function PremiumManagerCard({ manager, label, onInfo }: { manager: Manager; label: string; onInfo: () => void }) {
  return (
    <button className="manager-card compact-manager-card premium-manager-card" onClick={onInfo}>
      <div className={`portrait sm ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
      <strong className={managerEfficiencyClass(manager)}>{managerIncomeDeltaLabel(manager)}</strong>
      <small>{label}</small>
    </button>
  );
}

function ManagerBenchInfo({ info, onClose, onFire }: { info: { manager: Manager; slot: number | null; premium: boolean }; onClose: () => void; onFire: () => void }) {
  const { manager, premium } = info;
  return (
    <div className="modal-overlay">
      <div className="modal-box manager-info-modal">
        <div className="row-between mb-4">
          <h2>{premium ? "Прем менеджер" : `${RARITY_NAME[manager.rarity]} менеджер`}</h2>
          <button className="icon-quiet" onClick={onClose}>×</button>
        </div>
        <div className="manager-info-card">
          <div className={`portrait ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
          <div className="min-w-0">
            <div className={`text-sm font-bold ${managerEfficiencyClass(manager)}`}>Доход {managerIncomeDeltaLabel(manager)}</div>
            <div className="text-sm font-bold text-slate-500">Коэффициент зарплаты x{manager.salary.toFixed(2)}</div>
            <div className="text-xs font-bold text-slate-600">Реальная зарплата зависит от бизнеса.</div>
          </div>
        </div>
        {!premium && (
          <button className="primary-button danger" onClick={onFire}>
            <UserMinus size={18} /> Убрать из резерва
          </button>
        )}
        {premium && <div className="premium-note"><Gem size={16} /> Нанимается в окне выбора бизнеса за {PREMIUM_MANAGER_COST} 💎</div>}
      </div>
    </div>
  );
}

function formatTimer(seconds: number): string {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}
