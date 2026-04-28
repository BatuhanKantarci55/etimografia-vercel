// contexts/LevelContext.tsx
import { RealtimeChannel } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface LevelData {
  total_level_score: number;
  current_level: number;
  updated_at: string;
}

export interface LevelInfo {
  level: number;
  totalScore: number; // Toplam seviye puanı
  currentLevelScore: number; // Bu seviyede kazanılan puan (kalan)
  nextLevelTotalScore: number; // Bir sonraki seviye için gereken TOPLAM puan
  progress: number; // 0-1 arası (currentLevelScore / nextLevelScore)
  scoreToNextLevel: number; // Bir sonraki seviyeye kaç puan kaldı
}

interface LevelContextType {
  levelData: LevelData | null;
  levelInfo: LevelInfo | null;
  loading: boolean;
  refreshLevel: () => Promise<void>;
}

const LevelContext = createContext<LevelContextType | undefined>(undefined);

// Seviye hesaplama fonksiyonu
export function calculateLevel(totalScore: number): LevelInfo {
  let level = 1;
  let remainingScore = totalScore;
  let nextLevelScore = 500; // İlk seviye için 500 puan
  let nextLevelTotalScore = 500; // 2. seviye için gereken TOPLAM puan

  // Seviye atlama mantığı
  while (remainingScore >= nextLevelScore) {
    remainingScore -= nextLevelScore;
    level++;

    // Seviye aralıklarına göre gerekli puanı belirle
    if (level === 2) {
      nextLevelScore = 500; // 2. seviyeden 3. seviyeye geçmek için 500 puan
      nextLevelTotalScore = 1000; // 3. seviye için toplam 1000 puan
    } else if (level === 3) {
      nextLevelScore = 750; // 3. seviyeden 4. seviyeye geçmek için 750 puan
      nextLevelTotalScore = 1750; // 4. seviye için toplam 1750 puan
    } else if (level === 4) {
      nextLevelScore = 750; // 4. seviyeden 5. seviyeye geçmek için 750 puan
      nextLevelTotalScore = 2500; // 5. seviye için toplam 2500 puan
    } else if (level === 5) {
      nextLevelScore = 1000; // 5. seviyeden 6. seviyeye geçmek için 1000 puan
      nextLevelTotalScore = 3500; // 6. seviye için toplam 3500 puan
    } else if (level === 6) {
      nextLevelScore = 1000; // 6. seviyeden 7. seviyeye geçmek için 1000 puan
      nextLevelTotalScore = 4500; // 7. seviye için toplam 4500 puan
    } else if (level === 7) {
      nextLevelScore = 1250; // 7. seviyeden 8. seviyeye geçmek için 1250 puan
      nextLevelTotalScore = 5750; // 8. seviye için toplam 5750 puan
    } else if (level === 8) {
      nextLevelScore = 1250; // 8. seviyeden 9. seviyeye geçmek için 1250 puan
      nextLevelTotalScore = 7000; // 9. seviye için toplam 7000 puan
    } else if (level === 9) {
      nextLevelScore = 1500; // 9. seviyeden 10. seviyeye geçmek için 1500 puan
      nextLevelTotalScore = 8500; // 10. seviye için toplam 8500 puan
    } else if (level === 10) {
      nextLevelScore = 1500; // 10. seviyeden 11. seviyeye geçmek için 1500 puan
      nextLevelTotalScore = 10000; // 11. seviye için toplam 10000 puan
    } else {
      // 10+ seviyeler için her seviyede 250 puan artış
      nextLevelScore = 1500 + Math.floor((level - 10) / 2) * 250;
      nextLevelTotalScore = nextLevelTotalScore + nextLevelScore;
    }
  }

  // Mevcut seviye için gösterilecek toplam puanı hesapla
  let currentLevelTotalScore = 0;
  if (level === 1) {
    currentLevelTotalScore = 500;
  } else if (level === 2) {
    currentLevelTotalScore = 1000;
  } else if (level === 3) {
    currentLevelTotalScore = 1750;
  } else if (level === 4) {
    currentLevelTotalScore = 2500;
  } else if (level === 5) {
    currentLevelTotalScore = 3500;
  } else if (level === 6) {
    currentLevelTotalScore = 4500;
  } else if (level === 7) {
    currentLevelTotalScore = 5750;
  } else if (level === 8) {
    currentLevelTotalScore = 7000;
  } else if (level === 9) {
    currentLevelTotalScore = 8500;
  } else if (level === 10) {
    currentLevelTotalScore = 10000;
  } else {
    // 10+ seviyeler için
    currentLevelTotalScore = nextLevelTotalScore;
  }

  return {
    level,
    totalScore,
    currentLevelScore: remainingScore,
    nextLevelTotalScore: currentLevelTotalScore,
    progress: remainingScore / nextLevelScore,
    scoreToNextLevel: nextLevelScore - remainingScore,
  };
}

export function LevelProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] =
    useState<RealtimeChannel | null>(null);

  const fetchLevelData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("level_scores")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Kayıt yoksa oluştur
          const { data: newData, error: insertError } = await supabase
            .from("level_scores")
            .insert([
              {
                user_id: user.id,
                total_level_score: 0,
                current_level: 1,
              },
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          setLevelData(newData);
          setLevelInfo(calculateLevel(newData.total_level_score));
        } else {
          throw error;
        }
      } else {
        setLevelData(data);
        setLevelInfo(calculateLevel(data.total_level_score));
      }
    } catch (error) {
      console.error("Seviye verisi yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel("level-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "level_scores",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Seviye güncellendi:", payload);
          if (payload.new) {
            const newData = payload.new as LevelData;
            setLevelData(newData);
            setLevelInfo(calculateLevel(newData.total_level_score));
          }
        },
      )
      .subscribe();

    setRealtimeChannel(channel);
    fetchLevelData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  return (
    <LevelContext.Provider
      value={{
        levelData,
        levelInfo,
        loading,
        refreshLevel: fetchLevelData,
      }}
    >
      {children}
    </LevelContext.Provider>
  );
}

export const useLevel = () => {
  const context = useContext(LevelContext);
  if (context === undefined) {
    throw new Error("useLevel must be used within a LevelProvider");
  }
  return context;
};
