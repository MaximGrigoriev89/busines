import { LockKeyhole } from "lucide-react";
import { CATEGORIES } from "../data";
import { categoryNotificationSummary } from "../notifications";
import type { Business } from "../types";

interface TabsProps {
  active: number;
  unlocked: number;
  openingCategory: number | null;
  businesses: Business[];
  soft: number;
  onChange: (index: number) => void;
}

export function Tabs({ active, unlocked, openingCategory, businesses, soft, onChange }: TabsProps) {
  return (
    <nav className="tabs level-tabs" aria-label="Категории бизнесов">
      {CATEGORIES.map((category, index) => {
        const locked = index > unlocked;
        const opening = index === openingCategory;
        const notification = categoryNotificationSummary(businesses, index, soft);
        return (
          <button className={`tab ${active === index ? "active" : ""} ${locked ? "locked" : ""} ${opening ? "opening" : ""}`} disabled={locked} key={category.name} onClick={() => onChange(index)}>
            {notification.count > 0 && notification.tone && <span className={`tier-notification ${notification.tone}`}>{notification.count}</span>}
            <span className="tab-level">{category.name}</span>
            <span className="tab-stars">{category.icon}</span>
            {locked && <span className="tab-lock" aria-label="Заблокировано"><LockKeyhole size={10} /></span>}
          </button>
        );
      })}
    </nav>
  );
}
