// contexts/DailyStreakContext.tsx
import { RealtimeChannel } from "@supabase/supabase-js";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface DailyStreakData {
  id: string;
  user_id: string;
  current_streak: number;
  last_streak_date: string;
  updated_at: string;
}

interface DailyStreakContextType {
  streakData: DailyStreakData | null;
  loading: boolean;
  refreshStreak: () => Promise<void>;
  checkAndResetStreak: () => Promise<void>;
}

const DailyStreakContext = createContext<DailyStreakContextType | undefined>(
  undefined,
);

// Türkiye saatinde bugünün tarihini string olarak döndürür (YYYY-MM-DD)
const getTurkeyTodayString = (): string => {
  try {
    const now = new Date();
    // Türkiye saatini al (UTC+3)
    const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    return turkeyTime.toISOString().split("T")[0];
  } catch (error) {
    console.error("Tarih hesaplanırken hata:", error);
    // Fallback: UTC bugün
    return new Date().toISOString().split("T")[0];
  }
};

// Tarih string'ini Date objesine çevirir (güvenli)
const safeParseDate = (dateString: string): Date => {
  try {
    if (!dateString) {
      return new Date();
    }

    if (dateString.length === 10 && dateString.includes("-")) {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  } catch (error) {
    console.error("Tarih parse hatası:", error);
    return new Date();
  }
};

export function DailyStreakProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<DailyStreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] =
    useState<RealtimeChannel | null>(null);

  const fetchStreakData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log("📊 Streak verisi çekiliyor...");
      const { data, error } = await supabase
        .from("daily_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Kayıt yoksa oluştur
          const today = getTurkeyTodayString();
          console.log("📊 Yeni streak kaydı oluşturuluyor:", today);
          const { data: newData, error: insertError } = await supabase
            .from("daily_streaks")
            .insert([
              {
                user_id: user.id,
                current_streak: 0,
                last_streak_date: today,
              },
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          console.log("📊 Yeni streak kaydı oluşturuldu:", newData);
          setStreakData(newData);
        } else {
          throw error;
        }
      } else {
        console.log("📊 Streak verisi alındı:", data);
        setStreakData(data);
      }
    } catch (error) {
      console.error("Günlük seri verisi yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Gece yarısı streak kontrolü
  const checkAndResetStreak = useCallback(async () => {
    if (!user || !streakData) return;

    try {
      const today = getTurkeyTodayString();
      const lastDateStr = streakData.last_streak_date;

      if (!lastDateStr) {
        console.log("last_streak_date boş, kontrol yapılmıyor");
        return;
      }

      const lastDate = safeParseDate(lastDateStr);
      const todayDate = safeParseDate(today);

      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      console.log(
        `Streak kontrol: Son güncelleme: ${lastDateStr}, Bugün: ${today}, Fark: ${diffDays} gün`,
      );

      if (diffDays > 1) {
        console.log("Streak sıfırlanıyor: Son güncelleme 2+ gün önce");

        const { error } = await supabase
          .from("daily_streaks")
          .update({
            current_streak: 0,
            last_streak_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        // Güncel veriyi tekrar çek
        await fetchStreakData();
      }
    } catch (error) {
      console.error("Streak sıfırlama kontrolü hatası:", error);
    }
  }, [user, streakData, fetchStreakData]);

  // Realtime subscription - DÜZELTİLDİ
  useEffect(() => {
    if (!user) return;

    // Mevcut channel varsa temizle
    if (realtimeChannel) {
      console.log("📊 Eski realtime channel temizleniyor");
      supabase.removeChannel(realtimeChannel);
    }

    console.log("📊 Yeni realtime channel oluşturuluyor...");

    // Yeni channel oluştur
    const channel = supabase
      .channel(`daily-streak-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_streaks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("📊 REAL TIME - Streak güncellendi:", payload.new);
          // State'i güncelle
          setStreakData(payload.new as DailyStreakData);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "daily_streaks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("📊 REAL TIME - Streak eklendi:", payload.new);
          setStreakData(payload.new as DailyStreakData);
        },
      )
      .subscribe((status) => {
        console.log("📊 Realtime subscription status:", status);
      });

    setRealtimeChannel(channel);

    // İlk veriyi çek
    fetchStreakData();

    // Cleanup
    return () => {
      console.log("📊 Realtime channel temizleniyor");
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]); // streakData bağımlılığını kaldırdık

  // StreakData değiştiğinde kontrol yap
  useEffect(() => {
    if (streakData) {
      console.log("📊 StreakData değişti:", streakData);
      checkAndResetStreak();
    }
  }, [streakData?.last_streak_date]);

  // Gece yarısı kontrolü için interval
  useEffect(() => {
    if (!user) return;

    const checkMidnight = () => {
      const now = new Date();
      const turkeyNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

      if (turkeyNow.getHours() === 0 && turkeyNow.getMinutes() < 5) {
        console.log("📊 Gece yarısı kontrolü yapılıyor...");
        checkAndResetStreak();
      }
    };

    const interval = setInterval(checkMidnight, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, checkAndResetStreak]);

  return (
    <DailyStreakContext.Provider
      value={{
        streakData,
        loading,
        refreshStreak: fetchStreakData,
        checkAndResetStreak,
      }}
    >
      {children}
    </DailyStreakContext.Provider>
  );
}

export const useDailyStreak = () => {
  const context = useContext(DailyStreakContext);
  if (context === undefined) {
    throw new Error("useDailyStreak must be used within a DailyStreakProvider");
  }
  return context;
};
