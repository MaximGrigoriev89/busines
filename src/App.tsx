import { useEffect, useMemo, useRef, useState } from "react";
import { BusinessList } from "./components/BusinessList";
import { GoalBar, TopBar, type MainGoal } from "./components/Bars";
import { DetailPanel } from "./components/DetailPanel";
import { AdModal, LevelUnlockModal, ManagerModal, OfflineIncomeModal, VictoryModal } from "./components/Modals";
import { Managers } from "./components/Managers";
import { Tabs } from "./components/Tabs";
import { AD_DURATION_SECONDS, AD_MOVIE_QUIZZES, AD_QUIZ_BONUS, CATEGORIES, CATEGORY_UNLOCK_GOALS, COLLECT_TIME, GEM_AD_REWARD, MANAGER_COOLDOWN_SECONDS, OPTIMIZATION_COSTS, PREMIUM_MANAGER_COST } from "./data";
import { createBusinesses, createManager, createPremiumManager, effectiveIncome, expansionDurationSeconds, expansionProgress, nextBusinessOpenCost, nextOptimizationCost, tickBusinesses, unlockDelaySeconds } from "./game";
import { advanceOffline, clearProgress, loadProgress, saveProgress, type GameSnapshot } from "./save";
import type { ActiveAd, Business, ExpansionReward, Manager, OfflineIncome } from "./types";

interface IncomeBurst {
  id: number;
  businessId: number;
  amount: number;
  mode: "manual" | "auto";
}

export function App() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const [soft, setSoft] = useState(initialProgress.snapshot.soft);
  const [hard, setHard] = useState(initialProgress.snapshot.hard);
  const [businesses, setBusinesses] = useState(initialProgress.snapshot.businesses);
  const [activeCategory, setActiveCategory] = useState(initialProgress.snapshot.activeCategory);
  const [unlockedCategory, setUnlockedCategory] = useState(initialProgress.snapshot.unlockedCategory);
  const [unlockingCategory, setUnlockingCategory] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(initialProgress.snapshot.selectedId);
  const [businessPageOpen, setBusinessPageOpen] = useState(initialProgress.snapshot.businessPageOpen);
  const [managers, setManagers] = useState<Array<Manager | null>>(initialProgress.snapshot.managers);
  const [managerSeed, setManagerSeed] = useState(initialProgress.snapshot.managerSeed);
  const [managerCooldown, setManagerCooldown] = useState(initialProgress.snapshot.managerCooldown);
  const [assignBusinessId, setAssignBusinessId] = useState<number | null>(null);
  const [activeAd, setActiveAd] = useState<ActiveAd | null>(null);
  const [victoryShown, setVictoryShown] = useState(initialProgress.snapshot.victoryShown && finalQuestProgress(initialProgress.snapshot.businesses).ready);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [offlineIncome, setOfflineIncome] = useState<OfflineIncome | null>(initialProgress.offline);
  const [incomeBursts, setIncomeBursts] = useState<IncomeBurst[]>([]);
  const burstId = useRef(0);
  const autoEffectClock = useRef(0);
  const adTimer = useRef<number | null>(null);
  const adReward = useRef<(() => void) | null>(null);
  const unlockTimer = useRef<number | null>(null);
  const lastTickAt = useRef(performance.now());
  const pausedRef = useRef(false);
  const pausedAt = useRef<number | null>(null);
  const snapshotRef = useRef<GameSnapshot>(initialProgress.snapshot);
  const claimedExpansionRewards = useRef(new Set<string>());

  const selectedBusiness = businesses.find((item) => item.id === selectedId) ?? null;
  const totalAuto = useMemo(
    () => businesses.reduce((sum, item) => sum + (item.manager ? effectiveIncome(item) : 0), 0),
    [businesses],
  );
  const premiumPreview = useMemo(() => createPremiumManager(managerSeed), [managerSeed]);
  const finalGoalProgress = useMemo(() => finalQuestProgress(businesses), [businesses]);
  const currentGoal = useMemo<MainGoal | null>(() => {
    const unlockGoal = CATEGORY_UNLOCK_GOALS.find((goal) => goal.targetCategory === unlockedCategory + 1);
    if (unlockGoal) return { ...unlockGoal, kind: "money" };
    return victoryShown ? null : { kind: "final", ...finalGoalProgress };
  }, [finalGoalProgress, unlockedCategory, victoryShown]);

  snapshotRef.current = { soft, hard, businesses, activeCategory, unlockedCategory, selectedId, businessPageOpen, managers, managerSeed, managerCooldown, victoryShown };

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTickAt.current) / 1000;
      lastTickAt.current = now;
      if (pausedRef.current) return;
      setBusinesses((current) => {
        const result = tickBusinesses(current, dt);
        if (result.income > 0) setSoft((value) => value + result.income);
        if (result.gems > 0) setHard((value) => value + result.gems);
        autoEffectClock.current += dt;
        if (autoEffectClock.current >= 1) {
          autoEffectClock.current = 0;
          result.businesses.forEach((business) => {
            if (business.manager) addIncomeBurst(business.id, effectiveIncome(business), "auto");
          });
        }
        return result.businesses;
      });
      setManagerCooldown((value) => Math.max(0, value - dt));
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const save = () => saveProgress(snapshotRef.current);
    const timer = window.setInterval(save, 1500);
    window.addEventListener("beforeunload", save);
    window.addEventListener("pagehide", save);
    save();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  useEffect(() => {
    const pause = () => {
      if (pausedAt.current == null) pausedAt.current = Date.now();
      pausedRef.current = true;
      saveProgress(snapshotRef.current, pausedAt.current);
    };
    const resume = () => {
      if (document.hidden || !document.hasFocus()) return;
      const startedAt = pausedAt.current;
      pausedAt.current = null;
      pausedRef.current = false;
      lastTickAt.current = performance.now();
      if (startedAt != null) applyOfflineSeconds(Math.floor((Date.now() - startedAt) / 1000));
    };
    const handleVisibility = () => (document.hidden ? pause() : resume());
    window.addEventListener("blur", pause);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (managerCooldown > 0) return;
    const slot = managers.findIndex((manager) => !manager);
    if (slot >= 0) addRegularManager(slot);
  }, [managerCooldown, managers]);

  function runAd(callback: () => void) {
    if (adTimer.current != null) window.clearInterval(adTimer.current);
    adReward.current = callback;
    const quiz = AD_MOVIE_QUIZZES[Math.floor(Math.random() * AD_MOVIE_QUIZZES.length)];
    setActiveAd({ seconds: AD_DURATION_SECONDS, quiz, phase: "watching", selectedAnswer: null, correct: null });
    let left = AD_DURATION_SECONDS;
    adTimer.current = window.setInterval(() => {
      left -= 1;
      setActiveAd((current) => (
        current?.phase === "watching" ? { ...current, seconds: Math.max(0, left) } : current
      ));
      if (left <= 0) {
        if (adTimer.current != null) window.clearInterval(adTimer.current);
        adTimer.current = null;
        setActiveAd((current) => (
          current?.phase === "watching" ? { ...current, seconds: 0, phase: "quiz" } : current
        ));
      }
    }, 1000);
  }

  function handleAdAnswer(answer: string) {
    if (!activeAd || activeAd.phase !== "quiz") return;
    const correct = answer === activeAd.quiz.title;
    const reward = adReward.current;
    adReward.current = null;
    reward?.();
    if (correct) setHard((value) => value + AD_QUIZ_BONUS);
    setActiveAd({ ...activeAd, phase: "result", selectedAnswer: answer, correct });
  }

  function handleCloseAdResult() {
    if (activeAd?.phase !== "result") return;
    setActiveAd(null);
  }

  function applyOfflineSeconds(seconds: number) {
    if (seconds < 10) return;
    const result = advanceOffline(snapshotRef.current, seconds);
    snapshotRef.current = result.snapshot;
    setSoft(result.snapshot.soft);
    setHard(result.snapshot.hard);
    setBusinesses(result.snapshot.businesses);
    setManagerCooldown(result.snapshot.managerCooldown);
    if (result.income > 0) {
      setOfflineIncome((current) => ({
        seconds: (current?.seconds ?? 0) + seconds,
        income: (current?.income ?? 0) + result.income,
      }));
    }
    saveProgress(result.snapshot);
  }

  function handleDoubleOfflineIncome() {
    if (!offlineIncome || offlineIncome.income <= 0) return;
    const bonus = offlineIncome.income;
    runAd(() => {
      setSoft((value) => value + bonus);
      setOfflineIncome(null);
    });
  }

  function handleFullReset() {
    clearProgress();
    if (adTimer.current != null) window.clearInterval(adTimer.current);
    if (unlockTimer.current != null) window.clearTimeout(unlockTimer.current);
    adTimer.current = null;
    adReward.current = null;
    unlockTimer.current = null;
    pausedAt.current = null;
    pausedRef.current = false;
    lastTickAt.current = performance.now();
    burstId.current = 0;
    autoEffectClock.current = 0;
    claimedExpansionRewards.current.clear();
    setSoft(100);
    setHard(0);
    setBusinesses(createBusinesses());
    setActiveCategory(0);
    setUnlockedCategory(0);
    setUnlockingCategory(null);
    setSelectedId(0);
    setBusinessPageOpen(false);
    setManagers([createManager(0), createManager(1), createManager(2)]);
    setManagerSeed(3);
    setManagerCooldown(MANAGER_COOLDOWN_SECONDS);
    setAssignBusinessId(null);
    setActiveAd(null);
    setOfflineIncome(null);
    setVictoryShown(false);
    setVictoryOpen(false);
    setIncomeBursts([]);
  }

  function handleSearchManager(slot: number) {
    if (slot < 0 || managers[slot]) return;
    if (managerCooldown <= 0) addRegularManager(slot);
    else runAd(() => addRegularManager(slot));
  }

  function addRegularManager(slot: number) {
    setManagers((current) => {
      if (slot < 0 || current[slot]) return current;
      return current.map((manager, idx) => (idx === slot ? createManager(managerSeed) : manager));
    });
    setManagerSeed((seed) => seed + 1);
    setManagerCooldown(MANAGER_COOLDOWN_SECONDS);
  }

  function handleHirePremiumManager() {
    if (assignBusinessId == null || hard < PREMIUM_MANAGER_COST) return;
    const business = businesses.find((item) => item.id === assignBusinessId);
    if (!business?.opened || business.manager) return;
    setHard((value) => value - PREMIUM_MANAGER_COST);
    updateBusiness(assignBusinessId, (item) => ({ ...item, manager: createPremiumManager(managerSeed) }));
    setManagerSeed((seed) => seed + 1);
    setAssignBusinessId(null);
  }

  function handleGemAd() {
    runAd(() => setHard((value) => value + GEM_AD_REWARD));
  }

  function handleClaimGoal() {
    if (!currentGoal) return;
    if (currentGoal.kind === "final") {
      if (!currentGoal.ready || victoryShown) return;
      setVictoryShown(true);
      setVictoryOpen(true);
      return;
    }
    if (soft < currentGoal.cost || unlockingCategory != null) return;
    const targetCategory = currentGoal.targetCategory;
    const firstBusinessId = businesses.find((item) => item.catIdx === targetCategory)?.id ?? null;
    setSoft((value) => value - currentGoal.cost);
    setUnlockingCategory(targetCategory);
    if (unlockTimer.current != null) window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      setBusinesses((current) => current.map((item) => (
        item.catIdx === targetCategory && item.id === firstBusinessId
          ? { ...item, unlockRemaining: 0 }
          : item
      )));
      setUnlockedCategory(targetCategory);
      setActiveCategory(targetCategory);
      setSelectedId(firstBusinessId);
      setUnlockingCategory(null);
      unlockTimer.current = null;
    }, 1300);
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
    if (!business?.opened || !business.collectReady || business.manager) return;
    const amount = effectiveIncome(business) * COLLECT_TIME;
    setSoft((value) => value + amount);
    addIncomeBurst(id, amount, "manual");
    updateBusiness(id, (item) => ({ ...item, collectTimer: 0, collectReady: false }));
  }

  function openBusinessPage(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business?.opened) return;
    setSelectedId(id);
    setBusinessPageOpen(true);
  }

  function handleAssign(slot: number) {
    if (assignBusinessId == null || !managers[slot]) return;
    const business = businesses.find((item) => item.id === assignBusinessId);
    if (!business?.opened) return;
    updateBusiness(assignBusinessId, (item) => ({ ...item, manager: managers[slot] }));
    setManagers((current) => current.map((manager, idx) => (idx === slot ? null : manager)));
    setAssignBusinessId(null);
  }

  function handleBuyEquipment(id: number, requirementId: string, equipmentId: string) {
    const business = businesses.find((item) => item.id === id);
    const req = business?.requirements.find((item) => item.id === requirementId);
    if (!business?.opened || !req || req.type !== "equipment" || req.equipmentId !== equipmentId || req.owned >= req.quantity || soft < req.unitCost) return;
    setSoft((value) => value - req.unitCost);
    updateBusiness(id, (item) => ({
      ...item,
      requirements: item.requirements.map((current) => (
        current.id === requirementId && current.type === "equipment"
          ? { ...current, owned: current.owned + 1 }
          : current
      )),
    }));
  }

  function handleStartAction(id: number, requirementId: string) {
    const business = businesses.find((item) => item.id === id);
    const req = business?.requirements.find((item) => item.id === requirementId);
    if (!business?.opened || !req || req.type !== "action" || req.done || req.remaining > 0 || soft < req.cost) return;
    setSoft((value) => value - req.cost);
    updateBusiness(id, (item) => ({
      ...item,
      requirements: item.requirements.map((current) => (
        current.id === requirementId && current.type === "action"
          ? { ...current, remaining: current.duration }
          : current
      )),
    }));
  }

  function handleExpand(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business || business.maxed || business.expansionRemaining > 0 || !expansionProgress(business).ready) return;
    const duration = expansionDurationSeconds(business);
    updateBusiness(id, (item) => ({
      ...item,
      expansionRemaining: duration,
      expansionDuration: duration,
    }));
  }

  function handleClaimExpansionReward(id: number, reward: ExpansionReward) {
    const key = `${id}:${reward.fromTier}:${reward.toTier}`;
    if (claimedExpansionRewards.current.has(key)) return;
    claimedExpansionRewards.current.add(key);
    setHard((value) => value + reward.gems);
    updateBusiness(id, (item) => (
      item.pendingExpansionReward && `${item.id}:${item.pendingExpansionReward.fromTier}:${item.pendingExpansionReward.toTier}` === key
        ? { ...item, pendingExpansionReward: null }
        : item
    ));
  }

  function handleOptimizeBusiness(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business) return;
    const cost = nextOptimizationCost(business.optimizationLevel);
    if (cost == null || hard < cost) return;
    setHard((value) => value - cost);
    applyOptimization(id);
  }

  function handleOptimizeBusinessAd(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business || nextOptimizationCost(business.optimizationLevel) == null) return;
    runAd(() => applyOptimization(id));
  }

  function applyOptimization(id: number) {
    updateBusiness(id, (item) => (
      nextOptimizationCost(item.optimizationLevel) == null
        ? item
        : { ...item, optimizationLevel: item.optimizationLevel + 1 }
    ));
  }

  function handleOpenBusiness(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business || business.opened || business.unlockRemaining == null || business.unlockRemaining > 0 || soft < business.openCost) return;
    const nextBalance = soft - business.openCost;
    setSoft(nextBalance);
    setBusinesses((current) => current.map((item) => {
      if (item.id === id) return { ...item, opened: true };
      if (item.id === id + 1 && item.unlockRemaining == null && item.catIdx <= unlockedCategory) {
        return {
          ...item,
          openCost: nextBusinessOpenCost(nextBalance, item.id, item.catIdx),
          unlockRemaining: item.id < 4 ? 0 : unlockDelaySeconds(item.catIdx),
        };
      }
      return item;
    }));
  }

  function handleSkipUnlock(id: number) {
    const business = businesses.find((item) => item.id === id);
    if (!business || business.opened || business.unlockRemaining == null || business.unlockRemaining <= 0) return;
    runAd(() => updateBusiness(id, (item) => ({ ...item, unlockRemaining: 0 })));
  }

  const screenKey = businessPageOpen ? `detail-${selectedId ?? "none"}` : `main-${activeCategory}`;

  return (
    <main className="app-shell">
      <TopBar soft={soft} hard={hard} totalAuto={totalAuto} onGemAd={handleGemAd} onReset={handleFullReset} />
      {!businessPageOpen && <GoalBar soft={soft} goal={currentGoal} opening={unlockingCategory != null} onClaim={handleClaimGoal} />}
      <div className="content-scroll">
        <div className={`screen-transition ${businessPageOpen ? "detail-screen-transition" : "main-screen-transition"}`} key={screenKey}>
          {businessPageOpen ? (
            <DetailPanel business={selectedBusiness} soft={soft} hard={hard} onBack={() => setBusinessPageOpen(false)} onBuyEquipment={handleBuyEquipment} onStartAction={handleStartAction} onExpand={handleExpand} onClaimExpansionReward={handleClaimExpansionReward} onOptimize={handleOptimizeBusiness} onOptimizeAd={handleOptimizeBusinessAd} onOpenAssign={setAssignBusinessId} onRemoveManager={(id) => updateBusiness(id, (item) => ({ ...item, manager: null }))} />
          ) : (
            <div className="main-sections">
              <Managers managers={managers} premiumManager={premiumPreview} managerCooldown={managerCooldown} onSearch={handleSearchManager} onFire={(slot) => setManagers((current) => current.map((item, idx) => (idx === slot ? null : item)))} />
              <BusinessList
                businesses={businesses}
                activeCategory={activeCategory}
                selectedId={selectedId}
                soft={soft}
                hasFreeManager={managers.some((item) => !item)}
                hasStoredManager={managers.some(Boolean) || hard >= PREMIUM_MANAGER_COST}
                onSelect={openBusinessPage}
                onCollect={handleCollect}
                onOpenAssign={setAssignBusinessId}
                onRemoveManager={(id) => updateBusiness(id, (item) => ({ ...item, manager: null }))}
                onOpenBusiness={handleOpenBusiness}
                onSkipUnlock={handleSkipUnlock}
                incomeBursts={incomeBursts}
              />
            </div>
          )}
        </div>
      </div>
      {!businessPageOpen && <Tabs active={activeCategory} unlocked={unlockedCategory} openingCategory={unlockingCategory} businesses={businesses} soft={soft} onChange={(index) => { if (index > unlockedCategory) return; setActiveCategory(index); setSelectedId(businesses.find((item) => item.catIdx === index)?.id ?? null); }} />}
      <ManagerModal business={businesses.find((item) => item.id === assignBusinessId) ?? null} managers={managers} premiumManager={premiumPreview} hard={hard} managerCooldown={managerCooldown} open={assignBusinessId != null} onSearch={handleSearchManager} onPremiumHire={handleHirePremiumManager} onAssign={handleAssign} onFire={(slot) => setManagers((current) => current.map((item, idx) => (idx === slot ? null : item)))} onClose={() => setAssignBusinessId(null)} />
      <OfflineIncomeModal reward={offlineIncome} onClose={() => setOfflineIncome(null)} onDouble={handleDoubleOfflineIncome} />
      <AdModal ad={activeAd} onAnswer={handleAdAnswer} onCloseResult={handleCloseAdResult} />
      <LevelUnlockModal name={unlockingCategory == null ? null : CATEGORIES[unlockingCategory]?.name ?? null} />
      <VictoryModal open={victoryOpen} onClose={() => setVictoryOpen(false)} />
    </main>
  );
}

function finalQuestProgress(businesses: Business[]) {
  const maxOptimization = OPTIMIZATION_COSTS.length;
  const done = businesses.reduce((sum, business) => (
    sum
    + (business.opened && business.tier >= 4 ? 1 : 0)
    + (business.opened && business.optimizationLevel >= maxOptimization ? 1 : 0)
  ), 0);
  const total = businesses.length * 2;
  return { done, total, ready: total > 0 && done === total };
}
