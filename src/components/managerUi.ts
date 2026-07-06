import type { Manager } from "../types";

export function managerEfficiencyClass(manager: Manager): string {
  if (manager.efficiency < 1) return "manager-efficiency bad";
  if (manager.efficiency > 1) return "manager-efficiency good";
  return "manager-efficiency";
}
