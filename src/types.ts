export type Rarity = "white" | "green" | "blue" | "purple" | "orange";

export interface Manager {
  id: number;
  face: string;
  rarity: Rarity;
  efficiency: number;
  salary: number;
  desc: string;
}

export interface CategorySeed {
  name: string;
  icon: string;
  biz: Array<{ n: string; ic: string; base: number; salary: number }>;
}

export interface EquipmentItem {
  id: string;
  name: string;
  icon: string;
  baseCost: number;
}

export interface LongActionItem {
  id: string;
  name: string;
  icon: string;
  baseCost: number;
  baseSeconds: number;
}

export interface AdMovieQuiz {
  id: string;
  title: string;
  hints: string[];
  options: string[];
}

export interface ActiveAd {
  seconds: number;
  quiz: AdMovieQuiz;
  phase: "watching" | "quiz" | "result";
  selectedAnswer: string | null;
  correct: boolean | null;
}

export interface OfflineIncome {
  seconds: number;
  income: number;
}

export type ExpansionRequirement =
  | { id: string; type: "work"; requiredSeconds: number }
  | { id: string; type: "equipment"; equipmentId: string; quantity: number; owned: number; unitCost: number }
  | { id: string; type: "action"; actionId: string; cost: number; duration: number; remaining: number; done: boolean };

export interface ExpansionReward {
  fromTier: number;
  toTier: number;
  incomeBefore: number;
  incomeAfter: number;
  gems: number;
}

export interface Business {
  id: number;
  name: string;
  icon: string;
  catIdx: number;
  base: number;
  minSalary: number;
  tier: number;
  opened: boolean;
  openCost: number;
  unlockRemaining: number | null;
  manager: Manager | null;
  collectTimer: number;
  collectReady: boolean;
  workedSeconds: number;
  requirements: ExpansionRequirement[];
  expansionRemaining: number;
  expansionDuration: number;
  optimizationLevel: number;
  pendingExpansionReward: ExpansionReward | null;
  maxed: boolean;
}
