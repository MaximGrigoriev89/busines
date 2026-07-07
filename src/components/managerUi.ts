import type { Manager } from "../types";

export function managerEfficiencyClass(manager: Manager): string {
  if (manager.efficiency < 1) return "manager-efficiency bad";
  if (manager.efficiency > 1) return "manager-efficiency good";
  return "manager-efficiency";
}

export function managerIncomeDeltaLabel(manager: Manager): string {
  const delta = Math.round((manager.efficiency - 1) * 100);
  return `${delta >= 0 ? "+" : ""}${delta}%`;
}
