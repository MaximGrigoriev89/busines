import { useEffect, useMemo, useRef, useState } from "react";
import { BusinessList } from "./components/BusinessList";
import { GoalBar, GroupOptimization, TopBar } from "./components/Bars";
import { DetailPanel } from "./components/DetailPanel";
import { AdModal, ManagerModal, VictoryModal } from "./components/Modals";
import { Managers } from "./components/Managers";
import { Tabs } from "./components/Tabs";
import { CATEGORIES, COLLECT_TIME, GROUP_COSTS, MONEY_GOAL } from "./data";
import { createBusinesses, createManager, effectiveIncome, tickBusinesses, upgradeCost } from "./game";
import type { Business, Manager } from "./types";

interface IncomeBurst {
  id: number;
  businessId: number;
  amount: number;
  mode: "manual" | "auto";
}

export function App() {
  const [soft, setSoft] = useState(100);
  const [hard, setHard] = useState(150);
  const [businesses, setBusinesses] = useState(createBusinesses);
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(0);
  const [managers, setManagers] = useState<Array<Manager | null>>([null, null, null]);
  const [managerSeed, setManagerSeed] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  const [assignBusinessId, setAssignBusinessId] = useState<number | null>(null);
  const [groupLevels, setGroupLevels] = useState(CATEGORIES.map(() => 0));
  const [adSeconds, setAdSeconds] = useState<number | null>(null);
  const [victoryShown, setVictoryShown] = useState(false);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [incomeBursts, setIncomeBursts] = useState<IncomeBurst[]>([]);
  const burstId = useRef(0);
  const autoEffectClock = useRef(0);

  const selectedBusiness = businesses.find((item) => item.id === selectedId) ?? null;
  const totalAuto = useMemo(
    () => businesses.reduce((sum, item) => sum + (item.manager ? effectiveIncome(item, businesses, groupLevels) : 0), 0),
    [businesses, groupLevels],
  );

  useEffect(() => {
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setBusinesses((current) => {
        const result = tickBusinesses(current, groupLevels, dt);
        if (result.income > 0) setSoft((value) => value + result.income);
        autoEffectClock.current += dt;
        if (autoEffectClock.current >= 1) {
          autoEffectClock.current = 0;
          result.businesses.forEach((business) => {
            if (business.manager) addIncomeBurst(business.id, effectiveIncome(business, result.businesses, groupLevels), "auto");
          });
        }
        return result.businesses;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [groupLevels]);

  useEffect(() => {
    if (!victoryShown && soft >= MONEY_GOAL) {
      setVictoryShown(true);
      setVictoryOpen(true);
    }
  }, [soft, victoryShown]);

  function runAd(callback: () => void) {
    setAdSeconds(3);
    let left = 3;
    const timer = window.setInterval(() => {
      left -= 1;
      setAdSeconds(left);
      if (left <= 0) {
        window.clearInterval(timer);
        setAdSeconds(null);
        callback();
      }
    }, 1000);
  }

  function handleSearchManager(slot: number) {
    if (managers[slot]) return;
    const addManager = () => {
      setManagers((current) => current.map((manager, idx) => (idx === slot ? createManager(managerSeed) : manager)));
      setManagerSeed((seed) => seed + 1);
      setSearchCount((count) => count + 1);
    };
    if (searchCount === 0) addManager();
    else runAd(addManager);
  }

  function updateBusiness(id: number, updater: (business: Business) => Business) {
    setBusinesses((current) => current.map((item) => (item.id === id ? updater(item) : item)));
  }

  function addIncomeBurst(businessId: number, amount: number, mode: IncomeBurst["mode"]) {
    const id = burstId.current++;
    setIncomeBursts((current) => [...current, { id, businessId, amount, mode }]);
    window.setTimeout(() => setIncomeBursts((current) => current.filter((burst) => burst.id !== id)), 1100);
  }

  function handleCollect(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business?.collectReady || business.manager) return;
    const amount = effectiveIncome(business, businesses, groupLevels) * COLLECT_TIME;
    setSoft((value) => value + amount);
    addIncomeBurst(id, amount, "manual");
    updateBusiness(id, (item) => ({ ...item, collectTimer: 0, collectReady: false }));
  }

  function handleBuyUpgrade(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business || business.maxed || business.upCnt >= 5) return;
    const cost = upgradeCost(business);
    if (soft < cost) return;
    setSoft((value) => value - cost);
    updateBusiness(id, (item) => {
      const ups = [...item.ups];
      const nextIdx = ups.findIndex((value) => !value);
      if (nextIdx >= 0) ups[nextIdx] = true;
      const upCnt = item.upCnt + 1;
      return { ...item, ups, upCnt, tierActive: upCnt >= 5 && item.tier < 4, tierTimer: upCnt >= 5 && item.tier < 4 ? 30 : item.tierTimer, maxed: upCnt >= 5 && item.tier >= 4 };
    });
  }

  function handleAssign(slot: number) {
    if (assignBusinessId == null || !managers[slot]) return;
    updateBusiness(assignBusinessId, (item) => ({ ...item, manager: managers[slot] }));
    setManagers((current) => current.map((manager, idx) => (idx === slot ? null : manager)));
    setAssignBusinessId(null);
  }

  function handleInvestGroup() {
    const level = groupLevels[activeCategory] || 0;
    const cost = GROUP_COSTS[level];
    if (cost == null || hard < cost) return;
    setHard((value) => value - cost);
    setGroupLevels((levels) => levels.map((item, idx) => (idx === activeCategory ? item + 1 : item)));
  }

  return (
    <main className="app-shell">
      <TopBar soft={soft} hard={hard} totalAuto={totalAuto} />
      <GoalBar soft={soft} />
      <div className="content-scroll">
        <Managers managers={managers} searchCount={searchCount} onSearch={handleSearchManager} onFire={(slot) => setManagers((current) => current.map((item, idx) => (idx === slot ? null : item)))} />
        <Tabs active={activeCategory} onChange={(index) => { setActiveCategory(index); setSelectedId(businesses.find((item) => item.catIdx === index)?.id ?? null); }} />
        <BusinessList
          businesses={businesses}
          activeCategory={activeCategory}
          selectedId={selectedId}
          groupLevels={groupLevels}
          hasFreeManager={managers.some((item) => !item)}
          hasStoredManager={managers.some(Boolean)}
          onSelect={setSelectedId}
          onCollect={handleCollect}
          onOpenAssign={setAssignBusinessId}
          onRemoveManager={(id) => updateBusiness(id, (item) => ({ ...item, manager: null }))}
          incomeBursts={incomeBursts}
        />
        <DetailPanel business={selectedBusiness} businesses={businesses} groupLevels={groupLevels} soft={soft} onBuyUpgrade={handleBuyUpgrade} onSkipTimer={(id) => runAd(() => updateBusiness(id, (item) => ({ ...item, tierActive: false, tierDone: true, tierTimer: 0 })))} onExpand={(id) => updateBusiness(id, (item) => ({ ...item, tier: item.tier + 1, ups: [false, false, false, false, false], upCnt: 0, tierActive: false, tierDone: false, tierTimer: 0 }))} />
      </div>
      <GroupOptimization activeCategory={activeCategory} groupLevels={groupLevels} hard={hard} onInvest={handleInvestGroup} />
      <ManagerModal managers={managers} open={assignBusinessId != null} onAssign={handleAssign} onClose={() => setAssignBusinessId(null)} />
      <AdModal seconds={adSeconds} />
      <VictoryModal open={victoryOpen} onClose={() => setVictoryOpen(false)} />
    </main>
  );
}
