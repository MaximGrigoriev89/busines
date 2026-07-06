import { Check, Gem, Search, Tv, UserMinus, X } from "lucide-react";
import { AD_DURATION_SECONDS, AD_HINT_SECONDS, AD_QUIZ_BONUS, PREMIUM_MANAGER_COST, RARITY_CLASS, RARITY_NAME } from "../data";
import { formatMoney, managerSalary } from "../game";
import type { ActiveAd, Business, Manager, OfflineIncome } from "../types";
import { managerEfficiencyClass } from "./managerUi";

interface ManagerModalProps {
  business: Business | null;
  managers: Array<Manager | null>;
  premiumManager: Manager;
  hard: number;
  managerCooldown: number;
  open: boolean;
  onSearch: (slot: number) => void;
  onPremiumHire: () => void;
  onAssign: (slot: number) => void;
  onFire: (slot: number) => void;
  onClose: () => void;
}

export function ManagerModal({ business, managers, premiumManager, hard, managerCooldown, open, onSearch, onPremiumHire, onAssign, onFire, onClose }: ManagerModalProps) {
  if (!open) return null;
  const canHirePremium = hard >= PREMIUM_MANAGER_COST;
  const hireLabel = managerCooldown <= 0 ? "готов" : `реклама / ${formatTimer(managerCooldown)}`;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="row-between mb-4">
          <h2>Менеджеры</h2>
          <button className="icon-quiet" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="manager-modal-grid">
          {managers.map((manager, slot) => (
            <div className="manager-modal-slot" key={slot}>
              {manager ? (
                <div className="manager-choice">
                  <button className="manager-choice-main" onClick={() => onAssign(slot)}>
                    <div className={`portrait ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
                    <div className="min-w-0 text-left">
                      <div className="text-base font-black">{RARITY_NAME[manager.rarity]}</div>
                      <div className={`text-sm font-bold ${managerEfficiencyClass(manager)}`}>Эффективность {Math.round(manager.efficiency * 100)}%</div>
                      <div className="text-xs text-slate-500">{business ? `Зарплата $${managerSalary(business, manager).toFixed(2)}/сек` : `Зарпл. x${manager.salary.toFixed(2)}`}</div>
                    </div>
                  </button>
                  <button className="icon-danger" onClick={() => onFire(slot)} title="Отказать">
                    <UserMinus size={16} />
                  </button>
                </div>
              ) : (
                <button className="empty-manager modal-search" onClick={() => onSearch(slot)}>
                  <Search size={22} />
                  <span>Искать</span>
                  <small>{hireLabel}</small>
                </button>
              )}
            </div>
          ))}
          <div className="manager-modal-slot premium-slot">
            <div className="manager-choice premium-manager-card">
              <div className={`portrait ${RARITY_CLASS[premiumManager.rarity]}`}>{premiumManager.face}</div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-base font-black">Прем менеджер</div>
                <div className={`text-sm font-bold ${managerEfficiencyClass(premiumManager)}`}>Эффективность {Math.round(premiumManager.efficiency * 100)}%</div>
                <div className="text-xs text-slate-500">{business ? `Зарплата $${managerSalary(business, premiumManager).toFixed(2)}/сек` : `Зарпл. x${premiumManager.salary.toFixed(2)}`}</div>
              </div>
              <button className="manager-card-action" disabled={!canHirePremium} onClick={onPremiumHire}>
                <Gem size={15} />
                <span>{PREMIUM_MANAGER_COST} 💎</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdModal({ ad, onAnswer, onCloseResult }: { ad: ActiveAd | null; onAnswer: (answer: string) => void; onCloseResult: () => void }) {
  if (!ad) return null;
  const elapsed = AD_DURATION_SECONDS - ad.seconds;
  const hintIndex = Math.min(ad.quiz.hints.length - 1, Math.max(0, Math.floor(elapsed / AD_HINT_SECONDS)));
  const currentHint = ad.quiz.hints[hintIndex];
  return (
    <div className="modal-overlay">
      <div className="ad-box ad-quiz-box">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Реклама-квиз</div>
        {ad.phase === "watching" && (
          <>
            <div className="ad-countdown">{ad.seconds}</div>
            <div className="ad-hint-card">
              <small>Подсказка {hintIndex + 1}/5</small>
              <strong>{currentHint}</strong>
            </div>
            <div className="ad-hint-progress">
              {ad.quiz.hints.map((_, index) => (
                <span className={index <= hintIndex ? "active" : ""} key={index} />
              ))}
            </div>
          </>
        )}
        {ad.phase === "quiz" && (
          <>
            <div className="ad-question">Что это за фильм?</div>
            <div className="ad-quiz-options">
              {ad.quiz.options.map((option) => (
                <button className="ad-quiz-option" key={option} onClick={() => onAnswer(option)}>{option}</button>
              ))}
            </div>
          </>
        )}
        {ad.phase === "result" && (
          <>
            <div className={`ad-result ${ad.correct ? "correct" : "wrong"}`}>
              {ad.correct ? <Check size={26} /> : <X size={26} />}
              <strong>{ad.correct ? `Верно! +${AD_QUIZ_BONUS} 💎` : "Не угадали"}</strong>
              <small>Просмотр рекламы засчитан.</small>
            </div>
            <button className="primary-button expand" onClick={onCloseResult}>Забрать награду</button>
          </>
        )}
      </div>
    </div>
  );
}

export function OfflineIncomeModal({ reward, onClose, onDouble }: { reward: OfflineIncome | null; onClose: () => void; onDouble: () => void }) {
  if (!reward) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box offline-income-modal">
        <div className="offline-income-icon">$</div>
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Офлайн доход</div>
          <h2>Бизнес работал {formatOfflineDuration(reward.seconds)}</h2>
        </div>
        <div className="offline-income-amount">+${formatMoney(reward.income)}</div>
        <p>Доход начислен только от бизнесов с менеджерами.</p>
        <div className="offline-income-actions">
          <button className="primary-button expand" onClick={onDouble}>
            <Tv size={18} /> x2 за рекламу
          </button>
          <button className="primary-button" onClick={onClose}>Забрать</button>
        </div>
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
        <h2>Игра пройдена!</h2>
        <p>Напиши в тред по игре только</p>
        <div className="victory-code">67</div>
        <p>Так ты подтвердишь что прошёл её</p>
        <button className="primary-button expand" onClick={onClose}>Продолжить</button>
      </div>
    </div>
  );
}

export function LevelUnlockModal({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <div className="modal-overlay unlock-overlay">
      <div className="ad-box unlock-box">
        <div className="unlock-stars">★★★</div>
        <h2>{name}</h2>
        <p>Новый уровень бизнесов открыт</p>
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

function formatOfflineDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} ч ${minutes} мин`;
  if (minutes > 0) return `${minutes} мин`;
  return `${total} сек`;
}
