// contexts/GoldRewardContext.tsx
import React, { createContext, useCallback, useContext, useState } from "react";

interface GoldRewardContextType {
  circles: number;
  rewards: number[];
  currentIndex: number;
  totalGold: number;
  isComplete: boolean;
  startReward: () => void;
  openNextCircle: () => number | null;
  getCounts: () => {
    10: number;
    17: number;
    25: number;
    35: number;
    50: number;
    100: number;
  };
}

const GoldRewardContext = createContext<GoldRewardContextType | undefined>(
  undefined,
);

// YENİ ORANLAR (toplam 100)
const PROBABILITIES = [
  { value: 10, weight: 5 }, // %5
  { value: 17, weight: 20 }, // %20
  { value: 25, weight: 30 }, // %30
  { value: 35, weight: 25 }, // %25
  { value: 50, weight: 15 }, // %15
  { value: 100, weight: 5 }, // %5
];

function getRandomGoldValue(): number {
  const totalWeight = PROBABILITIES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const p of PROBABILITIES) {
    if (random < p.weight) return p.value;
    random -= p.weight;
  }
  return 10; // fallback
}

export function GoldRewardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rewards, setRewards] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const startReward = useCallback(() => {
    setRewards([]);
    setCurrentIndex(0);
    setIsComplete(false);
  }, []);

  const openNextCircle = useCallback((): number | null => {
    if (isComplete) return null;
    const value = getRandomGoldValue();
    const newRewards = [...rewards, value];
    setRewards(newRewards);
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    if (newIndex >= 10) {
      setIsComplete(true);
    }
    return value;
  }, [rewards, currentIndex, isComplete]);

  const getCounts = useCallback(() => {
    const counts = { 10: 0, 17: 0, 25: 0, 35: 0, 50: 0, 100: 0 };
    rewards.forEach((v) => {
      if (v === 10) counts[10]++;
      else if (v === 17) counts[17]++;
      else if (v === 25) counts[25]++;
      else if (v === 35) counts[35]++;
      else if (v === 50) counts[50]++;
      else if (v === 100) counts[100]++;
    });
    return counts;
  }, [rewards]);

  const totalGold = rewards.reduce((sum, v) => sum + v, 0);

  return (
    <GoldRewardContext.Provider
      value={{
        circles: 10,
        rewards,
        currentIndex,
        totalGold,
        isComplete,
        startReward,
        openNextCircle,
        getCounts,
      }}
    >
      {children}
    </GoldRewardContext.Provider>
  );
}

export const useGoldReward = () => {
  const context = useContext(GoldRewardContext);
  if (!context)
    throw new Error("useGoldReward must be used within GoldRewardProvider");
  return context;
};
