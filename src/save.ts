import { MANAGER_COOLDOWN_SECONDS } from "./data";
import { createBusinesses, createManager, createPremiumManager, tickBusinesses } from "./game";
import type { Business, Manager, OfflineIncome } from "./types";

const SAVE_KEY = "business-empire-save-v2";
const OFFLINE_THRESHOLD_SECONDS = 10;
const OFFLINE_INCOME_MULTIPLIER = 0.2;

export interface GameSnapshot {
  soft: number;
  hard: number;
  businesses: Business[];
  activeCategory: number;
  unlockedCategory: number;
  selectedId: number | null;
  businessPageOpen: boolean;
  managers: Array<Manager | null>;
  managerSeed: number;
  managerCooldown: number;
  victoryShown: boolean;
}

interface StoredGame extends GameSnapshot {
  savedAt: number;
}

export function defaultSnapshot(): GameSnapshot {
  return {
    soft: 100,
    hard: 0,
    businesses: createBusinesses(),
    activeCategory: 0,
    unlockedCategory: 0,
    selectedId: 0,
    businessPageOpen: false,
    managers: [createManager(0), createManager(1), createManager(2)],
    managerSeed: 3,
    managerCooldown: MANAGER_COOLDOWN_SECONDS,
    victoryShown: false,
  };
}

export function loadProgress(now = Date.now()): { snapshot: GameSnapshot; offline: OfflineIncome | null } {
  const stored = readStoredGame();
  const snapshot = stored ? sanitizeSnapshot(stored) : defaultSnapshot();
  if (!stored) return { snapshot, offline: null };
  const offlineSeconds = Math.max(0, Math.floor((now - stored.savedAt) / 1000));
  if (offlineSeconds < OFFLINE_THRESHOLD_SECONDS) return { snapshot, offline: null };
  const result = advanceOffline(snapshot, offlineSeconds);
  return {
    snapshot: result.snapshot,
    offline: result.income > 0 ? { seconds: offlineSeconds, income: result.income } : null,
  };
}

export function advanceOffline(snapshot: GameSnapshot, seconds: number): { snapshot: GameSnapshot; income: number } {
  const result = tickBusinesses(snapshot.businesses, seconds);
  const income = result.income * OFFLINE_INCOME_MULTIPLIER;
  return {
    snapshot: {
      ...snapshot,
      soft: snapshot.soft + income,
      hard: snapshot.hard + result.gems,
      businesses: result.businesses,
      managerCooldown: Math.max(0, snapshot.managerCooldown - seconds),
    },
    income,
  };
}

export function saveProgress(snapshot: GameSnapshot, savedAt = Date.now()) {
  if (typeof window === "undefined") return;
  const stored: StoredGame = { ...snapshot, savedAt };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(stored));
  } catch {
    // Storage can be blocked or full; gameplay should continue without persistence.
  }
}

export function clearProgress() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage failures during reset.
  }
}

function readStoredGame(): StoredGame | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) as StoredGame : null;
  } catch {
    return null;
  }
}

function sanitizeSnapshot(stored: StoredGame): GameSnapshot {
  const fallback = defaultSnapshot();
  return {
    soft: finiteOr(stored.soft, fallback.soft),
    hard: finiteOr(stored.hard, fallback.hard),
    businesses: mergeBusinesses(stored.businesses, fallback.businesses),
    activeCategory: clampInt(stored.activeCategory, 0, 4, fallback.activeCategory),
    unlockedCategory: clampInt(stored.unlockedCategory, 0, 4, fallback.unlockedCategory),
    selectedId: typeof stored.selectedId === "number" ? stored.selectedId : fallback.selectedId,
    businessPageOpen: Boolean(stored.businessPageOpen),
    managers: sanitizeManagers(stored.managers, fallback.managers),
    managerSeed: clampInt(stored.managerSeed, 0, 100000, fallback.managerSeed),
    managerCooldown: finiteOr(stored.managerCooldown, fallback.managerCooldown),
    victoryShown: Boolean(stored.victoryShown),
  };
}

function mergeBusinesses(saved: Business[] | undefined, fallback: Business[]): Business[] {
  if (!Array.isArray(saved)) return fallback;
  return fallback.map((base) => {
    const item = saved.find((candidate) => candidate?.id === base.id);
    if (!item) return base;
    return {
      ...base,
      tier: clampInt(item.tier, 1, 4, base.tier),
      opened: Boolean(item.opened),
      openCost: normalizeOpenCost(item, base),
      unlockRemaining: item.unlockRemaining == null ? null : Math.max(0, finiteOr(item.unlockRemaining, 0)),
      manager: sanitizeManager(item.manager),
      collectTimer: Math.max(0, finiteOr(item.collectTimer, base.collectTimer)),
      collectReady: Boolean(item.collectReady),
      workedSeconds: Math.max(0, finiteOr(item.workedSeconds, base.workedSeconds)),
      requirements: item.opened && Array.isArray(item.requirements) ? item.requirements : base.requirements,
      expansionRemaining: Math.max(0, finiteOr(item.expansionRemaining, base.expansionRemaining)),
      expansionDuration: Math.max(0, finiteOr(item.expansionDuration, base.expansionDuration)),
      optimizationLevel: clampInt(item.optimizationLevel, 0, 5, base.optimizationLevel),
      pendingExpansionReward: item.pendingExpansionReward ?? null,
      maxed: Boolean(item.maxed),
    };
  });
}

function sanitizeManagers(managers: Array<Manager | null> | undefined, fallback: Array<Manager | null>) {
  if (!Array.isArray(managers)) return fallback;
  return [0, 1, 2].map((index) => sanitizeManager(managers[index]));
}

function sanitizeManager(manager: Manager | null | undefined): Manager | null {
  if (!manager || typeof manager.id !== "number") return null;
  return manager.id >= 10_000 ? createPremiumManager(manager.id - 10_000) : createManager(manager.id);
}

function normalizeOpenCost(item: Business, base: Business): number {
  const stored = finiteOr(item.openCost, base.openCost);
  if (item.opened) return stored;
  return stored > base.openCost * 1.35 ? base.openCost : stored;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
