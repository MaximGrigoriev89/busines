import { MANAGER_COOLDOWN_SECONDS, MANAGER_ROLL_MAX_ATTEMPTS, MAX_BUSINESS_TIER, OPTIMIZATION_COSTS } from "./data";
import { createBusinesses, createManager, createPremiumManager, syncHoldingCategoryBusinesses, tickBusinesses } from "./game";
import { AD_SOURCE_IDS, type AdStats, type Business, type Manager, type ManagerRecruitment, type OfflineIncome } from "./types";

const SAVE_KEY = "business-empire-save-v2";
export const OFFLINE_THRESHOLD_SECONDS = 10;
const OFFLINE_INCOME_MULTIPLIER = 0.2;

export interface GameSnapshot {
  soft: number;
  hard: number;
  businesses: Business[];
  activeCategory: number;
  unlockedCategory: number;
  selectedId: number | null;
  businessPageOpen: boolean;
  managerRecruitment: ManagerRecruitment;
  managerSeed: number;
  adWatchedCount: number;
  adStats: AdStats;
  victoryShown: boolean;
}

interface OfflineAdvanceOptions {
  grantIncome?: boolean;
}

interface StoredGame extends Partial<GameSnapshot> {
  savedAt: number;
  managers?: Array<Manager | null>;
  managerCooldown?: number;
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
    managerRecruitment: createDefaultRecruitment(),
    managerSeed: 2,
    adWatchedCount: 0,
    adStats: createDefaultAdStats(),
    victoryShown: false,
  };
}

export function loadProgress(now = Date.now()): { snapshot: GameSnapshot; offline: OfflineIncome | null } {
  const stored = readStoredGame();
  const snapshot = stored ? sanitizeSnapshot(stored) : defaultSnapshot();
  if (!stored) return { snapshot, offline: null };
  const offlineSeconds = Math.max(0, Math.floor((now - stored.savedAt) / 1000));
  if (offlineSeconds <= 0) return { snapshot, offline: null };
  const grantIncome = offlineSeconds >= OFFLINE_THRESHOLD_SECONDS;
  const result = advanceOffline(snapshot, offlineSeconds, { grantIncome });
  return {
    snapshot: result.snapshot,
    offline: grantIncome && result.income > 0 ? { seconds: offlineSeconds, income: result.income } : null,
  };
}

export function advanceOffline(snapshot: GameSnapshot, seconds: number, options: OfflineAdvanceOptions = {}): { snapshot: GameSnapshot; income: number } {
  const elapsedSeconds = Math.max(0, seconds);
  const result = tickBusinesses(snapshot.businesses, elapsedSeconds);
  const income = options.grantIncome === false ? 0 : result.income * OFFLINE_INCOME_MULTIPLIER;
  return {
    snapshot: {
      ...snapshot,
      soft: snapshot.soft + income,
      hard: snapshot.hard + result.gems,
      businesses: result.businesses,
      managerRecruitment: advanceRecruitment(snapshot.managerRecruitment, elapsedSeconds),
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
  const businesses = syncHoldingCategoryBusinesses(mergeBusinesses(stored.businesses, fallback.businesses));
  const adWatchedCount = clampInt(stored.adWatchedCount ?? fallback.adWatchedCount, 0, 1_000_000_000, fallback.adWatchedCount);
  return {
    soft: finiteOr(stored.soft ?? fallback.soft, fallback.soft),
    hard: finiteOr(stored.hard ?? fallback.hard, fallback.hard),
    businesses,
    activeCategory: clampInt(stored.activeCategory ?? fallback.activeCategory, 0, 4, fallback.activeCategory),
    unlockedCategory: clampInt(stored.unlockedCategory ?? fallback.unlockedCategory, 0, 4, fallback.unlockedCategory),
    selectedId: typeof stored.selectedId === "number" ? stored.selectedId : fallback.selectedId,
    businessPageOpen: Boolean(stored.businessPageOpen),
    managerRecruitment: sanitizeRecruitment(stored, fallback.managerRecruitment),
    managerSeed: Math.max(2, clampInt(stored.managerSeed ?? fallback.managerSeed, 0, 100000, fallback.managerSeed)),
    adWatchedCount,
    adStats: sanitizeAdStats(stored.adStats, adWatchedCount),
    victoryShown: Boolean(stored.victoryShown),
  };
}

export function createDefaultAdStats(): AdStats {
  return AD_SOURCE_IDS.reduce((result, source) => {
    result[source] = 0;
    return result;
  }, {} as AdStats);
}

export function createDefaultRecruitment(): ManagerRecruitment {
  return {
    candidate: null,
    attempts: MANAGER_ROLL_MAX_ATTEMPTS,
    cooldown: MANAGER_COOLDOWN_SECONDS,
    searchRemaining: 0,
    pendingSeed: null,
  };
}

export function advanceRecruitment(recruitment: ManagerRecruitment, seconds: number): ManagerRecruitment {
  let attempts = Math.max(0, Math.floor(recruitment.attempts));
  let cooldown = Math.max(0, finiteOr(recruitment.cooldown, MANAGER_COOLDOWN_SECONDS));
  let searchRemaining = Math.max(0, finiteOr(recruitment.searchRemaining, 0) - seconds);
  let candidate = recruitment.candidate;
  let pendingSeed = recruitment.pendingSeed;

  if (recruitment.searchRemaining > 0 && searchRemaining <= 0 && pendingSeed != null) {
    candidate = createManager(pendingSeed);
    pendingSeed = null;
    searchRemaining = 0;
  }

  if (attempts >= MANAGER_ROLL_MAX_ATTEMPTS) {
    return { candidate, attempts, cooldown: MANAGER_COOLDOWN_SECONDS, searchRemaining, pendingSeed };
  }

  cooldown -= seconds;
  while (cooldown <= 0 && attempts < MANAGER_ROLL_MAX_ATTEMPTS) {
    attempts += 1;
    cooldown += MANAGER_COOLDOWN_SECONDS;
  }

  return {
    candidate,
    attempts,
    cooldown: attempts >= MANAGER_ROLL_MAX_ATTEMPTS ? MANAGER_COOLDOWN_SECONDS : Math.max(0, cooldown),
    searchRemaining,
    pendingSeed,
  };
}

function sanitizeAdStats(stored: Partial<AdStats> | undefined, adWatchedCount: number): AdStats {
  const stats = createDefaultAdStats();
  for (const source of AD_SOURCE_IDS) {
    stats[source] = clampInt(stored?.[source] ?? 0, 0, 1_000_000_000, 0);
  }
  const knownTotal = AD_SOURCE_IDS.reduce((sum, source) => sum + stats[source], 0);
  if (knownTotal < adWatchedCount) {
    stats.other += adWatchedCount - knownTotal;
  }
  return stats;
}

function mergeBusinesses(saved: Business[] | undefined, fallback: Business[]): Business[] {
  if (!Array.isArray(saved)) return fallback;
  return fallback.map((base) => {
    const item = saved.find((candidate) => candidate?.id === base.id);
    if (!item) return base;
    const tier = clampInt(item.tier, 1, MAX_BUSINESS_TIER, base.tier);
    return {
      ...base,
      tier,
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
      optimizationLevel: clampInt(item.optimizationLevel, 0, OPTIMIZATION_COSTS.length, base.optimizationLevel),
      pendingExpansionReward: item.pendingExpansionReward ?? null,
      maxed: Boolean(item.maxed) || tier >= MAX_BUSINESS_TIER,
      mergedIntoHolding: Boolean(item.mergedIntoHolding),
    };
  });
}

function sanitizeRecruitment(stored: StoredGame, fallback: ManagerRecruitment): ManagerRecruitment {
  const source = stored.managerRecruitment;
  const legacyCandidate = Array.isArray(stored.managers)
    ? stored.managers.map(sanitizeManager).find((manager): manager is Manager => Boolean(manager)) ?? null
    : null;
  return {
    candidate: sanitizeManager(source?.candidate) ?? legacyCandidate ?? fallback.candidate,
    attempts: clampInt(source?.attempts ?? fallback.attempts, 0, 99, fallback.attempts),
    cooldown: Math.max(0, finiteOr(source?.cooldown ?? stored.managerCooldown ?? fallback.cooldown, fallback.cooldown)),
    searchRemaining: Math.max(0, finiteOr(source?.searchRemaining ?? 0, 0)),
    pendingSeed: typeof source?.pendingSeed === "number" ? source.pendingSeed : null,
  };
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
