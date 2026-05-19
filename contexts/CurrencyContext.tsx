// contexts/CurrencyContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface CurrencyData {
  gold: number;
  diamond: number;
}

interface StatsData {
  // Altın (yeni değerler)
  gold_10_count: number;
  gold_17_count: number;
  gold_25_count: number;
  gold_35_count: number;
  gold_50_count: number;
  gold_100_count: number;
  // Elmas (aynı)
  diamond_1_count: number;
  diamond_2_count: number;
  diamond_3_count: number;
  diamond_5_count: number;
}

interface CurrencyContextType {
  currencies: CurrencyData | null;
  stats: StatsData | null;
  loading: boolean;
  addGold: (
    amount: number,
    counts?: Partial<Record<10 | 17 | 25 | 35 | 50 | 100, number>>,
  ) => Promise<void>;
  addDiamond: (
    amount: number,
    counts?: Partial<Record<1 | 2 | 3 | 5, number>>,
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

const defaultStats: StatsData = {
  gold_10_count: 0,
  gold_17_count: 0,
  gold_25_count: 0,
  gold_35_count: 0,
  gold_50_count: 0,
  gold_100_count: 0,
  diamond_1_count: 0,
  diamond_2_count: 0,
  diamond_3_count: 0,
  diamond_5_count: 0,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currencies, setCurrencies] = useState<CurrencyData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setCurrencies(null);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Bakiyeleri al
      const { data: currencyData, error: currencyError } = await supabase
        .from("user_currencies")
        .select("gold, diamond")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currencyError) throw currencyError;

      let finalCurrency = currencyData;
      if (!currencyData) {
        // Kayıt yoksa oluştur
        const { data: newCurr, error: insertError } = await supabase
          .from("user_currencies")
          .insert({ user_id: user.id, gold: 0, diamond: 0 })
          .select("gold, diamond")
          .maybeSingle();
        if (insertError) throw insertError;
        finalCurrency = newCurr;
      }

      // 2. İstatistikleri al
      const { data: statsData, error: statsError } = await supabase
        .from("user_currency_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (statsError) throw statsError;

      let finalStats = statsData;
      if (!statsData) {
        const { data: newStats, error: insertStatsError } = await supabase
          .from("user_currency_stats")
          .insert({ user_id: user.id })
          .select("*")
          .maybeSingle();
        if (insertStatsError) throw insertStatsError;
        finalStats = newStats;
      }

      setCurrencies(finalCurrency || { gold: 0, diamond: 0 });
      setStats(finalStats || { ...defaultStats });
    } catch (error) {
      console.error("CurrencyContext fetchData hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const addGold = async (
    amount: number,
    counts?: Partial<Record<10 | 17 | 25 | 35 | 50 | 100, number>>,
  ) => {
    if (!user || !currencies) return;
    try {
      const newGold = currencies.gold + amount;

      // Güncelle
      const { error: updateError } = await supabase
        .from("user_currencies")
        .update({ gold: newGold, updated_at: new Date() })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      // İstatistik güncelleme
      if (counts) {
        const updates: Partial<StatsData> = {};
        if (counts[10])
          updates.gold_10_count = (stats?.gold_10_count || 0) + counts[10];
        if (counts[17])
          updates.gold_17_count = (stats?.gold_17_count || 0) + counts[17];
        if (counts[25])
          updates.gold_25_count = (stats?.gold_25_count || 0) + counts[25];
        if (counts[35])
          updates.gold_35_count = (stats?.gold_35_count || 0) + counts[35];
        if (counts[50])
          updates.gold_50_count = (stats?.gold_50_count || 0) + counts[50];
        if (counts[100])
          updates.gold_100_count = (stats?.gold_100_count || 0) + counts[100];

        if (Object.keys(updates).length) {
          const { error: statsError } = await supabase
            .from("user_currency_stats")
            .update(updates)
            .eq("user_id", user.id);
          if (statsError) throw statsError;
        }
      }

      setCurrencies((prev) => (prev ? { ...prev, gold: newGold } : prev));
      await fetchData(); // Senkronizasyon
    } catch (error) {
      console.error("Altın eklenirken hata:", error);
      throw error;
    }
  };

  const addDiamond = async (
    amount: number,
    counts?: Partial<Record<1 | 2 | 3 | 5, number>>,
  ) => {
    if (!user || !currencies) return;
    try {
      const newDiamond = currencies.diamond + amount;

      const { error: updateError } = await supabase
        .from("user_currencies")
        .update({ diamond: newDiamond, updated_at: new Date() })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      if (counts) {
        const updates: Partial<StatsData> = {};
        if (counts[1])
          updates.diamond_1_count = (stats?.diamond_1_count || 0) + counts[1];
        if (counts[2])
          updates.diamond_2_count = (stats?.diamond_2_count || 0) + counts[2];
        if (counts[3])
          updates.diamond_3_count = (stats?.diamond_3_count || 0) + counts[3];
        if (counts[5])
          updates.diamond_5_count = (stats?.diamond_5_count || 0) + counts[5];

        if (Object.keys(updates).length) {
          const { error: statsError } = await supabase
            .from("user_currency_stats")
            .update(updates)
            .eq("user_id", user.id);
          if (statsError) throw statsError;
        }
      }

      setCurrencies((prev) => (prev ? { ...prev, diamond: newDiamond } : prev));
      await fetchData();
    } catch (error) {
      console.error("Elmas eklenirken hata:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        stats,
        loading,
        addGold,
        addDiamond,
        refresh: fetchData,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};
