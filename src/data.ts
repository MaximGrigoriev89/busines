import type { CategorySeed, ManagerStat, Rarity } from "./types";

export const MONEY_GOAL = 1_000_000;
export const COLLECT_TIME = 15;
export const GROUP_COSTS = [10, 20, 30, 40, 50];

export const RARITIES: Rarity[] = ["white", "green", "blue", "purple", "orange"];

export const RARITY_NAME: Record<Rarity, string> = {
  white: "Обычный",
  green: "Необычный",
  blue: "Редкий",
  purple: "Эпический",
  orange: "Легендарный",
};

export const STAT_FULL: Record<ManagerStat, string> = {
  inc5: "Увеличивает доход этого бизнеса на 5%",
  off5: "Увеличивает офлайн-доход этого бизнеса на 5%",
  inc20: "Увеличивает доход этого бизнеса на 20%",
  cost50: "Снижает стоимость улучшений этого бизнеса на 50%",
  offcap20: "Увеличивает лимит офлайн-накоплений на 20%",
  solo100: "Удваивает доход, если другие бизнесы в категории без менеджеров",
  full30: "Увеличивает доход на 30%, если вся категория прокачана до макс.",
  step1: "Даёт +1% дохода за каждый шаг прокачки бизнеса в категории",
  dbl2: "Удваивает эффект менеджеров двух ближайших соседей в категории",
};

export const RARITY_CLASS: Record<Rarity, string> = {
  white: "border-zinc-300 from-zinc-700 to-zinc-900 text-zinc-200",
  green: "border-emerald-400 from-emerald-900 to-slate-950 text-emerald-300",
  blue: "border-sky-400 from-sky-950 to-slate-950 text-sky-300",
  purple: "border-violet-400 from-violet-950 to-slate-950 text-violet-300",
  orange: "border-amber-400 from-amber-950 to-slate-950 text-amber-300",
};

export const FACES = [
  "👨‍💼", "👩‍💼", "🧔", "👩‍🦰", "🧑‍💼", "👨‍🦳", "👩‍🦱", "🧑‍🔧", "👨‍🍳", "👩‍🔬",
  "🧑‍💻", "👨‍🏫", "👩‍⚕️", "🧑‍🎨", "👨‍🚀", "👩‍🌾", "🧑‍🍳", "👨‍🔧", "👩‍💻", "🧑‍⚕️",
];

export const CATEGORIES: CategorySeed[] = [
  { name: "Еда", icon: "🍽️", biz: [
    { n: "Ресторан", ic: "🍝", base: 2 }, { n: "Кафе", ic: "☕", base: 1.5 },
    { n: "Пекарня", ic: "🥐", base: 1.2 }, { n: "Суши-бар", ic: "🍣", base: 2.5 },
  ] },
  { name: "Технологии", icon: "💻", biz: [
    { n: "IT-студия", ic: "🖥️", base: 3 }, { n: "Ремонт техники", ic: "🔧", base: 2 },
    { n: "Веб-агентство", ic: "🌐", base: 3.5 }, { n: "Геймдев", ic: "🎮", base: 4 },
  ] },
  { name: "Красота", icon: "💄", biz: [
    { n: "Салон красоты", ic: "💇", base: 1.8 }, { n: "Фитнес-клуб", ic: "🏋️", base: 2.2 },
    { n: "Спа-центр", ic: "🧖", base: 2.8 }, { n: "Барбершоп", ic: "✂️", base: 1.5 },
  ] },
  { name: "Транспорт", icon: "🚗", biz: [
    { n: "Автомойка", ic: "🚿", base: 1 }, { n: "Такси-парк", ic: "🚕", base: 2.5 },
    { n: "Автосервис", ic: "🔩", base: 3 }, { n: "Логистика", ic: "🚛", base: 4.5 },
  ] },
  { name: "Развлечения", icon: "🎭", biz: [
    { n: "Кинотеатр", ic: "🎬", base: 3 }, { n: "Клуб", ic: "🎶", base: 3.5 },
    { n: "Квест-рум", ic: "🔑", base: 2 }, { n: "Аркада", ic: "🕹️", base: 2.5 },
  ] },
];

export const UPGRADE_NAMES = [
  "Нанять персонал",
  "Арендовать помещение",
  "Найти поставщиков",
  "Настроить логистику",
  "Закупить оборудование",
];
