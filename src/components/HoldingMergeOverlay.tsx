import { Building2, GitMerge, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import { formatMoney } from "../game";

export interface HoldingMergeAnimation {
  categoryName: string;
  beforeIncome: number;
  afterIncome: number;
  businesses: Array<{
    id: number;
    name: string;
    icon: string;
  }>;
}

interface HoldingMergeOverlayProps {
  merge: HoldingMergeAnimation | null;
  onClose: () => void;
}

export function HoldingMergeOverlay({ merge, onClose }: HoldingMergeOverlayProps) {
  if (!merge) return null;

  const incomeDelta = merge.afterIncome - merge.beforeIncome;
  const percentDelta = merge.beforeIncome > 0 ? (incomeDelta / merge.beforeIncome) * 100 : null;
  const positions = [
    { x: "-132px", y: "-50px" },
    { x: "112px", y: "-44px" },
    { x: "-116px", y: "54px" },
    { x: "126px", y: "50px" },
  ];

  return (
    <div className="holding-merge-overlay" role="dialog" aria-label="Слияние в холдинг" onClick={onClose}>
      <div className="holding-merge-box">
        <div className="holding-merge-head">
          <div className="holding-merge-kicker"><GitMerge size={15} /> Слияние завершено</div>
          <h2>{merge.categoryName}: холдинг</h2>
        </div>

        <div className="holding-merge-stage" aria-hidden="true">
          <div className="holding-merge-core">
            <Building2 size={34} />
          </div>
          {merge.businesses.map((business, index) => (
            <div
              className="holding-merge-business"
              style={{
                "--merge-index": index,
                "--merge-from-x": positions[index % positions.length].x,
                "--merge-from-y": positions[index % positions.length].y,
              } as CSSProperties}
              key={business.id}
            >
              <span>{business.icon}</span>
              <small>{business.name}</small>
            </div>
          ))}
        </div>

        <div className="holding-profit-flow">
          <div className="holding-profit-card">
            <span>Было</span>
            <strong>${formatMoney(merge.beforeIncome)}/сек</strong>
          </div>
          <TrendingUp size={22} />
          <div className="holding-profit-card after">
            <span>Стало</span>
            <strong>${formatMoney(merge.afterIncome)}/сек</strong>
          </div>
        </div>

        <div className="holding-profit-gain">
          <span>Прирост профита</span>
          <strong>{formatSignedIncome(incomeDelta)}</strong>
          {percentDelta != null && <small>{formatSignedPercent(percentDelta)}</small>}
        </div>
      </div>
    </div>
  );
}

function formatSignedIncome(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}$${formatMoney(Math.abs(value))}/сек`;
}

function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(0)}%`;
}
