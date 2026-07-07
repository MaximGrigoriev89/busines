import { Check, RefreshCw, Search, Tv, X } from "lucide-react";
import { AD_DURATION_SECONDS, AD_HINT_SECONDS, AD_QUIZ_BONUS, MANAGER_AD_REROLL_ATTEMPTS, PREMIUM_MANAGER_COST, RARITY_CLASS, RARITY_NAME } from "../data";
import { formatMoney, managerSalary } from "../game";
import type { ActiveAd, AdSource, AdStats, Business, Manager, OfflineIncome } from "../types";
import { managerEfficiencyClass } from "./managerUi";

const AD_STAT_ROWS: Array<{ source: AdSource; label: string; note: string }> = [
  { source: "gems", label: "Гемы", note: "Кнопка в верхней панели" },
  { source: "managerAttempts", label: "Попытки менеджера", note: "Окно менеджеров" },
  { source: "offlineIncome", label: "Офлайн-доход", note: "Удвоение награды" },
  { source: "skipExpansion", label: "Ускорение расширения", note: "Экран бизнеса" },
  { source: "optimization", label: "Оптимизация", note: "Оптимизация за рекламу" },
  { source: "skipUnlock", label: "Открытие бизнеса", note: "Пропуск таймера" },
  { source: "other", label: "Без категории", note: "Старые просмотры" },
];

interface ManagerModalProps {
  business: Business | null;
  regularManager: Manager | null;
  premiumManager: Manager;
  hard: number;
  attempts: number;
  maxAttempts: number;
  rechargeRemaining: number;
  searchRemaining: number;
  searchDuration: number;
  open: boolean;
  onPremiumHire: () => void;
  onAssignRegular: () => void;
  onReroll: () => void;
  onRerollAd: () => void;
  onClose: () => void;
}

export function ManagerModal({ business, regularManager, premiumManager, hard, attempts, maxAttempts, rechargeRemaining, searchRemaining, searchDuration, open, onPremiumHire, onAssignRegular, onReroll, onRerollAd, onClose }: ManagerModalProps) {
  if (!open) return null;
  const canHirePremium = hard >= PREMIUM_MANAGER_COST;
  const searching = searchRemaining > 0;
  const canReroll = attempts > 0 && !searching;
  const nextAttemptText = attempts >= maxAttempts ? "Попытки полные" : `+1 через ${formatTimer(rechargeRemaining)}`;
  const searchPct = searching ? Math.max(0, Math.min(100, 100 - (searchRemaining / searchDuration) * 100)) : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-box manager-roll-modal">
        <div className="row-between mb-4">
          <h2>Менеджеры</h2>
          <button className="icon-quiet" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="manager-roll-status">
          <span>Попытки: {attempts}</span>
          <span>{nextAttemptText}</span>
        </div>
        <div className="manager-roll-grid">
          <div className="manager-offer-card premium">
            <div className="manager-offer-main">
              <ManagerOfferBody
                business={business}
                manager={premiumManager}
                title="Прем менеджер"
                subtitle="Гарантированно сильный"
                badge={`${PREMIUM_MANAGER_COST} 💎`}
              />
            </div>
            <button className="manager-choose-button premium" disabled={!canHirePremium} onClick={(event) => { event.stopPropagation(); onPremiumHire(); }}>
              Купить за {PREMIUM_MANAGER_COST} 💎
            </button>
          </div>
          <div className={`manager-offer-card regular ${searching ? "searching" : ""}`}>
            <div className="manager-offer-main">
              {regularManager ? (
                <ManagerOfferBody
                  business={business}
                  manager={regularManager}
                  title={searching ? "Идет поиск" : "Найден менеджер"}
                  subtitle={searching ? formatTimer(searchRemaining) : "Нажми, чтобы назначить"}
                  badge={searching ? "поиск" : RARITY_NAME[regularManager.rarity]}
                />
              ) : (
                <div className="manager-empty-state">
                  <Search size={28} />
                  <strong>Нет кандидата</strong>
                  <small>{attempts > 0 ? "Поиск запустится автоматически" : "Попытки закончились"}</small>
                </div>
              )}
            </div>
            <button className="manager-choose-button" disabled={!regularManager || searching} onClick={(event) => { event.stopPropagation(); onAssignRegular(); }}>
              Выбрать
            </button>
            {searching && (
              <div className="manager-search-progress">
                <div style={{ width: `${searchPct}%` }} />
              </div>
            )}
            <button className="manager-reroll-button" disabled={!canReroll} onClick={(event) => { event.stopPropagation(); onReroll(); }}>
              <RefreshCw size={16} />
              <span>{searching ? `Поиск ${formatTimer(searchRemaining)}` : attempts > 0 ? "Искать еще" : "Нет попыток"}</span>
            </button>
          </div>
        </div>
        <button className="primary-button ad manager-reroll-ad" onClick={(event) => { event.stopPropagation(); onRerollAd(); }}>
          <Tv size={18} /> Получить +{MANAGER_AD_REROLL_ATTEMPTS} попытки за рекламу
        </button>
      </div>
    </div>
  );
}

function ManagerOfferBody({ business, manager, title, subtitle, badge }: { business: Business | null; manager: Manager; title: string; subtitle: string; badge: string }) {
  const trait = manager.trait || "Без особенностей";
  return (
    <>
      <div className={`portrait ${RARITY_CLASS[manager.rarity]}`}>{manager.face}</div>
      <div className="manager-offer-copy">
        <div className="manager-offer-head">
          <strong>{title}</strong>
          <span>{badge}</span>
        </div>
        <small>{subtitle}</small>
        <div className="manager-trait-pill">{trait}</div>
        <div className={`manager-offer-stat ${managerEfficiencyClass(manager)}`}>Эффективность {Math.round(manager.efficiency * 100)}%</div>
        <div className="manager-offer-stat muted">{business ? `Зарплата $${managerSalary(business, manager).toFixed(2)}/сек` : `Зарпл. x${manager.salary.toFixed(2)}`}</div>
      </div>
    </>
  );
}

export function AdStatsModal({ open, total, stats, onClose }: { open: boolean; total: number; stats: AdStats; onClose: () => void }) {
  if (!open) return null;
  const rows = AD_STAT_ROWS.filter((row) => row.source !== "other" || stats.other > 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box ad-stats-modal" onClick={(event) => event.stopPropagation()}>
        <div className="row-between">
          <h2>Реклама</h2>
          <button className="icon-quiet" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ad-stats-total">
          <Tv size={18} />
          <span>Всего просмотрено</span>
          <strong>{total}</strong>
        </div>
        <div className="ad-stats-list">
          {rows.map((row) => (
            <div className="ad-stat-row" key={row.source}>
              <div className="ad-stat-icon"><Tv size={15} /></div>
              <div className="ad-stat-copy">
                <strong>{row.label}</strong>
                <span>{row.note}</span>
              </div>
              <b>{stats[row.source] ?? 0}</b>
            </div>
          ))}
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
          <button className="primary-button muted offline-income-claim" onClick={onClose}>Забрать без бонуса</button>
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
        <p>Так ты подтвердишь, что прошел ее</p>
        <button className="primary-button expand" onClick={onClose}>Продолжить</button>
      </div>
    </div>
  );
}

export function LevelUnlockModal({ name, onClose }: { name: string | null; onClose: () => void }) {
  if (!name) return null;
  return (
    <div className="modal-overlay unlock-overlay" onClick={onClose}>
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
