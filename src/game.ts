import { CATEGORIES, COLLECT_TIME, FACES, GROUP_COSTS, RARITIES } from "./data";
import type { Business, Manager } from "./types";

export function createBusinesses(): Business[] {
  let id = 0;
  return CATEGORIES.flatMap((cat, catIdx) =>
    cat.biz.map((seed) => ({
      id: id++,
      name: seed.n,
      icon: seed.ic,
      catIdx,
      base: seed.base,
      tier: 1,
      ups: [false, false, false, false, false],
      upCnt: 0,
      manager: null,
      collectTimer: 0,
      collectReady: false,
      tierTimer: 0,
      tierActive: false,
      tierDone: false,
      maxed: false,
    })),
  );
}

export function createManager(seed: number): Manager {
  const rarity = RARITIES[seed % RARITIES.length];
  const face = FACES[seed % FACES.length];
  let stat: Manager["stat"] = null;
  let desc = "";

  if (rarity === "green") [stat, desc] = seed % 2 ? ["off5", "+5% офлайн"] : ["inc5", "+5% доход"];
  if (rarity === "blue") [stat, desc] = seed % 2 ? ["cost50", "-50% цена улучш."] : ["inc20", "+20% доход"];
  if (rarity === "purple") [stat, desc] = seed % 2 ? ["solo100", "+100% если соло"] : ["offcap20", "+20% офлайн-кап"];
  if (rarity === "orange") {
    const options: Array<[Manager["stat"], string]> = [
      ["full30", "+30% макс. кат."],
      ["step1", "+1%/шаг кат."],
      ["dbl2", "x2 соседям"],
    ];
    [stat, desc] = options[seed % options.length];
  }

  return { id: seed, face, rarity, stat, desc };
}

export function upgradeCost(business: Business): number {
  const base = 3 + business.id * 2;
  const tierMult = Math.pow(1.8, business.tier - 1);
  const stepMult = 1 + business.upCnt * 0.4;
  const managerMult = business.manager?.stat === "cost50" ? 0.5 : 1;
  return Math.max(1, Math.floor(base * tierMult * stepMult * managerMult));
}

export function effectiveIncome(business: Business, businesses: Business[], groupLevels: number[]): number {
  let income = business.base;
  income *= 1 + (business.tier - 1) * 1.5;
  income *= 1 + business.upCnt * 0.15;
  income *= 1 + (groupLevels[business.catIdx] || 0) * 0.05;

  const manager = business.manager;
  if (manager?.stat === "inc5") income *= 1.05;
  if (manager?.stat === "inc20") income *= 1.2;
  if (manager?.stat === "solo100" && categoryBusinesses(business, businesses).every((x) => x.id === business.id || !x.manager)) income *= 2;
  if (manager?.stat === "full30" && categoryBusinesses(business, businesses).every((x) => x.maxed)) income *= 1.3;
  if (manager?.stat === "step1") income *= 1 + categorySteps(business.catIdx, businesses) * 0.01;

  const cat = categoryBusinesses(business, businesses);
  const ownIdx = cat.findIndex((x) => x.id === business.id);
  cat.forEach((neighbor, idx) => {
    if (neighbor.id === business.id || neighbor.manager?.stat !== "dbl2" || !manager) return;
    if (Math.abs(idx - ownIdx) <= 1 && manager.stat === "inc5") income *= 1.05;
    if (Math.abs(idx - ownIdx) <= 1 && manager.stat === "inc20") income *= 1.2;
  });

  return income;
}

export function tickBusinesses(businesses: Business[], groupLevels: number[], dt: number): { businesses: Business[]; income: number } {
  let income = 0;
  const next = businesses.map((business) => {
    const updated = { ...business, ups: [...business.ups] };
    if (updated.manager) income += effectiveIncome(updated, businesses, groupLevels) * dt;
    else if (!updated.collectReady) {
      updated.collectTimer = Math.min(COLLECT_TIME, updated.collectTimer + dt);
      updated.collectReady = updated.collectTimer >= COLLECT_TIME;
    }

    if (updated.tierActive && !updated.tierDone) {
      updated.tierTimer = Math.max(0, updated.tierTimer - dt);
      if (updated.tierTimer <= 0) Object.assign(updated, { tierActive: false, tierDone: true });
    }
    return updated;
  });
  return { businesses: next, income };
}

export function formatMoney(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return Math.floor(value).toString();
}

export function nextGroupCost(level: number): number | null {
  return level >= GROUP_COSTS.length ? null : GROUP_COSTS[level];
}

function categoryBusinesses(business: Business, businesses: Business[]): Business[] {
  return businesses.filter((item) => item.catIdx === business.catIdx);
}

function categorySteps(catIdx: number, businesses: Business[]): number {
  return businesses
    .filter((item) => item.catIdx === catIdx)
    .reduce((sum, item) => sum + item.upCnt + (item.tier - 1) * 5, 0);
}
