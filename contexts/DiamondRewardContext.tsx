import React, { createContext, useCallback, useContext, useState } from "react";

interface DiamondRewardContextType {
  circles: number;
  rewards: number[];
  currentIndex: number;
  totalDiamond: number;
  isComplete: boolean;
  startReward: () => void;
  openNextCircle: () => number | null;
  getCounts: () => { 1: number; 2: number; 3: number; 5: number };
}

const DiamondRewardContext = createContext<
  DiamondRewardContextType | undefined
>(undefined);

const PROBABILITIES = [
  { value: 5, weight: 20 },
  { value: 3, weight: 30 },
  { value: 2, weight: 30 },
  { value: 1, weight: 20 },
];

function getRandomDiamondValue(): number {
  const totalWeight = PROBABILITIES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const p of PROBABILITIES) {
    if (random < p.weight) return p.value;
    random -= p.weight;
  }
  return 1;
}

export function DiamondRewardProvider({
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
    const value = getRandomDiamondValue();
    const newRewards = [...rewards, value];
    setRewards(newRewards);
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    if (newIndex >= 5) {
      setIsComplete(true);
    }
    return value;
  }, [rewards, currentIndex, isComplete]);

  const getCounts = useCallback(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 5: 0 };
    rewards.forEach((v) => {
      if (v === 1) counts[1]++;
      else if (v === 2) counts[2]++;
      else if (v === 3) counts[3]++;
      else if (v === 5) counts[5]++;
    });
    return counts;
  }, [rewards]);

  const totalDiamond = rewards.reduce((sum, v) => sum + v, 0);

  return (
    <DiamondRewardContext.Provider
      value={{
        circles: 5,
        rewards,
        currentIndex,
        totalDiamond,
        isComplete,
        startReward,
        openNextCircle,
        getCounts,
      }}
    >
      {children}
    </DiamondRewardContext.Provider>
  );
}

export const useDiamondReward = () => {
  const context = useContext(DiamondRewardContext);
  if (!context)
    throw new Error(
      "useDiamondReward must be used within DiamondRewardProvider",
    );
  return context;
};
