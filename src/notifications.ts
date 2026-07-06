import { expansionProgress } from "./game";
import type { Business } from "./types";

export type BusinessNotificationTone = "upgrade" | "reward" | "open";

export interface BusinessNotification {
  tone: BusinessNotificationTone;
  label: string;
}

export interface CategoryNotificationSummary {
  count: number;
  tone: BusinessNotificationTone | null;
}

const TONE_PRIORITY: BusinessNotificationTone[] = ["reward", "open", "upgrade"];

export function businessNotifications(business: Business, soft: number): BusinessNotification[] {
  const notifications: BusinessNotification[] = [];

  if (business.pendingExpansionReward) {
    notifications.push({ tone: "reward", label: "Награда" });
  }

  if (!business.opened && business.unlockRemaining === 0 && soft >= business.openCost) {
    notifications.push({ tone: "open", label: "Открыть" });
  }

  if (
    business.opened &&
    !business.pendingExpansionReward &&
    !business.maxed &&
    business.expansionRemaining <= 0 &&
    expansionProgress(business).ready
  ) {
    notifications.push({ tone: "upgrade", label: "Апгрейд" });
  }

  return notifications;
}

export function categoryNotificationSummary(businesses: Business[], categoryIndex: number, soft: number): CategoryNotificationSummary {
  const notifications = businesses
    .filter((business) => business.catIdx === categoryIndex)
    .flatMap((business) => businessNotifications(business, soft));
  const tone = TONE_PRIORITY.find((item) => notifications.some((notification) => notification.tone === item)) ?? null;
  return { count: notifications.length, tone };
}
