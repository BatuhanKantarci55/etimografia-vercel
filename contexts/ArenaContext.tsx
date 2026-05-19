import { supabase } from "@lib/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type Arena = {
  id: number;
  arena_number: number;
  name: string;
  min_trophies: number;
  max_trophies: number | null;
  hero_name: string;
};

export type UserArenaProgress = {
  id: string;
  user_id: string;
  current_arena_id: number;
  current_trophies: number;
  highest_trophies: number;
  updated_at: string;
};

type ArenaContextType = {
  arenas: Arena[];
  currentArena: Arena | null;
  userProgress: UserArenaProgress | null;
  isLoading: boolean;
  refreshArenaData: () => Promise<void>;
  updateTrophies: (trophyChange: number) => Promise<number | null>;
  getHeroPieces: (heroName: string) => Promise<number[]>;
  getCurrentArenaHero: () => string | null;
};

const ArenaContext = createContext<ArenaContextType>({
  arenas: [],
  currentArena: null,
  userProgress: null,
  isLoading: true,
  refreshArenaData: async () => {},
  updateTrophies: async () => null,
  getHeroPieces: async () => [],
  getCurrentArenaHero: () => null,
});

export const useArena = () => useContext(ArenaContext);

export const ArenaProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [currentArena, setCurrentArena] = useState<Arena | null>(null);
  const [userProgress, setUserProgress] = useState<UserArenaProgress | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const refreshArenaData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Arenaları getir
      const { data: arenasData } = await supabase
        .from("arenas")
        .select("*")
        .order("arena_number");

      if (arenasData) setArenas(arenasData);

      // Kullanıcı ilerlemesini getir
      let { data: progressData } = await supabase
        .from("user_arena_progress")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!progressData) {
        // İlk kez, varsayılan arenayı oluştur
        const defaultArena = arenasData?.find((a) => a.arena_number === 1);
        if (defaultArena) {
          const { data: newProgress } = await supabase
            .from("user_arena_progress")
            .insert({
              user_id: user.id,
              current_arena_id: defaultArena.id,
              current_trophies: 0,
              highest_trophies: 0,
            })
            .select()
            .single();

          progressData = newProgress;
        }
      }

      if (progressData) {
        setUserProgress(progressData);

        // Mevcut arenayı bul
        const currentArenaData = arenasData?.find(
          (a) => a.id === progressData.current_arena_id,
        );
        setCurrentArena(currentArenaData || null);
      }
    } catch (error) {
      console.error("Arena verileri yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrophies = async (
    trophyChange: number,
  ): Promise<number | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("update_user_trophies", {
        p_user_id: user.id,
        p_trophy_change: trophyChange,
      });

      if (error) throw error;

      await refreshArenaData();
      return data;
    } catch (error) {
      console.error("Kupa güncellenirken hata:", error);
      return null;
    }
  };

  const getHeroPieces = async (heroName: string): Promise<number[]> => {
    if (!user) return [];

    const { data } = await supabase
      .from("hero_pieces")
      .select("piece_index")
      .eq("user_id", user.id)
      .eq("hero_name", heroName);

    return data?.map((p) => p.piece_index) || [];
  };

  const getCurrentArenaHero = (): string | null => {
    return currentArena?.hero_name || null;
  };

  useEffect(() => {
    refreshArenaData();
  }, [user]);

  return (
    <ArenaContext.Provider
      value={{
        arenas,
        currentArena,
        userProgress,
        isLoading,
        refreshArenaData,
        updateTrophies,
        getHeroPieces,
        getCurrentArenaHero,
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
};
