export type Rarity = "white" | "green" | "blue" | "purple" | "orange";

export type ManagerStat =
  | "inc5"
  | "off5"
  | "inc20"
  | "cost50"
  | "offcap20"
  | "solo100"
  | "full30"
  | "step1"
  | "dbl2";

export interface Manager {
  id: number;
  face: string;
  rarity: Rarity;
  stat: ManagerStat | null;
  desc: string;
}

export interface CategorySeed {
  name: string;
  icon: string;
  biz: Array<{ n: string; ic: string; base: number }>;
}

export interface Business {
  id: number;
  name: string;
  icon: string;
  catIdx: number;
  base: number;
  tier: number;
  ups: boolean[];
  upCnt: number;
  manager: Manager | null;
  collectTimer: number;
  collectReady: boolean;
  tierTimer: number;
  tierActive: boolean;
  tierDone: boolean;
  maxed: boolean;
}
