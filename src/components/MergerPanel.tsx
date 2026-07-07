import { Building2, GitMerge, LockKeyhole, Star, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { CATEGORIES, FINAL_CORPORATION_NAME, holdingBusinessNameForCategory } from "../data";
import { categoryMergerStatus, formatMoney, HOLDING_GLOBAL_INCOME_BONUS, isHoldingCategory } from "../game";
import type { Business } from "../types";

interface MergerPanelProps {
  businesses: Business[];
  activeCategory: number;
  onMerge: (categoryIndex: number) => void;
}

export function MergerPanel({ businesses, activeCategory, onMerge }: MergerPanelProps) {
  const status = categoryMergerStatus(businesses, activeCategory);
  const categoryName = CATEGORIES[activeCategory]?.name ?? "Группа";
  const finalCorporation = isHoldingCategory(activeCategory);
  const holdingName = finalCorporation ? FINAL_CORPORATION_NAME : holdingBusinessNameForCategory(activeCategory);
  const progress = status.starsTotal > 0 ? Math.min(100, (status.starsDone / status.starsTotal) * 100) : 0;
  const bonusPercent = HOLDING_GLOBAL_INCOME_BONUS * 100;
  const stateText = status.merged
    ? finalCorporation ? "Корпорация" : "Холдинг"
    : status.ready
      ? "Готово"
      : "Не готово";
  const description = status.merged
    ? finalCorporation
      ? "Холдинги объединены в финальную корпорацию."
      : `Бизнесы остановлены, менеджеров можно менять.`
    : status.ready
      ? finalCorporation
        ? "Все холдинги готовы к корпорации."
        : `Вся шкала ${categoryName} заполнена.`
      : finalCorporation
        ? "Откройте и прокачайте холдинги для корпорации."
        : "Заполните шкалу группы для слияния.";
  const ActionIcon = status.merged ? TrendingUp : status.ready ? GitMerge : LockKeyhole;

  return (
    <section className={`panel merger-panel ${status.ready ? "ready" : ""} ${status.merged ? "merged" : ""}`}>
      <div className="row-between merger-head">
        <div className="section-title"><GitMerge size={15} /> Слияние группы</div>
        <span className="merger-state">{stateText}</span>
      </div>
      <div className="merger-main-row">
        <div className="merger-emblem">
          <Building2 size={25} />
          {status.merged && (
            <div className="holding-income-stream" aria-hidden="true">
              <span>$</span>
              <span>$</span>
              <span>$</span>
            </div>
          )}
        </div>
        <div className="merger-copy">
          <strong>{holdingName}</strong>
          <span>{description}</span>
        </div>
        <button
          className="merger-action"
          disabled={!status.ready || status.merged}
          onClick={() => onMerge(activeCategory)}
          title={status.ready ? finalCorporation ? "Объединить холдинги в корпорацию" : "Объединить бизнесы группы" : "Нужно заполнить шкалу группы"}
        >
          <ActionIcon size={17} />
          <span>{status.merged ? "Есть" : status.ready ? finalCorporation ? "Собрать" : "Слить" : "Нет"}</span>
        </button>
      </div>
      <div className="merger-metrics">
        <MergerMetric label={<Star size={12} fill="currentColor" />} value={`${status.starsDone}/${status.starsTotal}`} />
        <MergerMetric label="Бонус" value={`+${bonusPercent}%`} tone="boost" />
        <MergerMetric label="Доход" value={`$${formatMoney(status.holdingIncome)}/сек`} />
      </div>
      <div className="progress-track merger-progress">
        <div className="group-fill" style={{ width: `${status.merged ? 100 : progress}%` }} />
      </div>
    </section>
  );
}

function MergerMetric({ label, value, tone }: { label: ReactNode; value: string; tone?: "boost" }) {
  return (
    <div className={`merger-metric ${tone ?? ""}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
