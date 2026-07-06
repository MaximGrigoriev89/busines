import { Search, UserMinus } from "lucide-react";
import { RARITY_CLASS, RARITY_NAME, STAT_FULL } from "../data";
import type { Manager } from "../types";

interface ManagersProps {
  managers: Array<Manager | null>;
  searchCount: number;
  onSearch: (slot: number) => void;
  onFire: (slot: number) => void;
}

export function Managers({ managers, searchCount, onSearch, onFire }: ManagersProps) {
  return (
    <section className="panel">
      <div className="section-title mb-3">👔 Менеджеры</div>
      <div className="grid grid-cols-3 gap-3">
        {managers.map((manager, slot) => (
          <div className="manager-slot" key={slot}>
            {manager ? (
              <ManagerCard manager={manager} onFire={() => onFire(slot)} />
            ) : (
              <button className="empty-manager" onClick={() => onSearch(slot)}>
                <Search size={22} />
                <span>Искать</span>
                <small>{searchCount === 0 ? "Бесплатно" : "Реклама"}</small>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ManagerCard({ manager, onFire }: { manager: Manager; onFire: () => void }) {
  const desc = manager.stat ? STAT_FULL[manager.stat] : "Без особых способностей";
  return (
    <div className="manager-card">
      <div className={`portrait ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black">{RARITY_NAME[manager.rarity]}</div>
        <div className="truncate text-xs font-bold text-slate-300">{manager.desc || desc}</div>
      </div>
      <button className="icon-danger" onClick={onFire} title="Отказать">
        <UserMinus size={16} />
      </button>
    </div>
  );
}
