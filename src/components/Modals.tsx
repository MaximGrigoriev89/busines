import { X } from "lucide-react";
import { RARITY_CLASS, RARITY_NAME, STAT_FULL } from "../data";
import type { Manager } from "../types";

interface ManagerModalProps {
  managers: Array<Manager | null>;
  open: boolean;
  onAssign: (slot: number) => void;
  onClose: () => void;
}

export function ManagerModal({ managers, open, onAssign, onClose }: ManagerModalProps) {
  if (!open) return null;
  const available = managers.map((manager, slot) => ({ manager, slot })).filter((item) => item.manager);
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="row-between mb-4">
          <h2>Выберите менеджера</h2>
          <button className="icon-quiet" onClick={onClose}><X size={18} /></button>
        </div>
        {available.length === 0 ? (
          <div className="empty-modal">Нет доступных менеджеров.</div>
        ) : (
          <div className="space-y-3">
            {available.map(({ manager, slot }) => manager && (
              <button className="manager-choice" key={manager.id} onClick={() => onAssign(slot)}>
                <div className={`portrait ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
                <div className="min-w-0 text-left">
                  <div className="text-base font-black">{RARITY_NAME[manager.rarity]}</div>
                  <div className="text-sm font-bold text-slate-300">{manager.desc}</div>
                  <div className="text-xs text-slate-500">{manager.stat ? STAT_FULL[manager.stat] : "Без особых способностей"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdModal({ seconds }: { seconds: number | null }) {
  if (seconds == null) return null;
  return (
    <div className="modal-overlay">
      <div className="ad-box">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Реклама</div>
        <div className="mt-3 text-7xl font-black text-white">{seconds}</div>
      </div>
    </div>
  );
}

export function VictoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box victory">
        <div className="text-6xl">🏆</div>
        <h2>Цель выполнена!</h2>
        <p>Бизнесы накопили $1 000 000. Можно продолжать прокачку групп и искать сильные связки менеджеров.</p>
        <button className="primary-button expand" onClick={onClose}>Продолжить</button>
      </div>
    </div>
  );
}
