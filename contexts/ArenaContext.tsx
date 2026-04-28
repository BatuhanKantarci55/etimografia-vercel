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

export type ChestProgress = {
  id: string;
  user_id: string;
  arena_id: number;
  segment_index: number;
  status: "locked" | "available" | "opened";
  opened_at: string | null;
  updated_at: string;
};

type ArenaContextType = {
  arenas: Arena[];
  currentArena: Arena | null;
  userProgress: UserArenaProgress | null;
  chestProgress: ChestProgress[];
  isLoading: boolean;
  refreshArenaData: () => Promise<void>;
  openChest: (arenaId: number, segmentIndex: number) => Promise<boolean>;
  getHeroPieces: (heroName: string) => Promise<number[]>;
  getHeroCompletion: (heroName: string) => number;
  getCurrentArenaHero: () => string | null;
};

const ArenaContext = createContext<ArenaContextType>({
  arenas: [],
  currentArena: null,
  userProgress: null,
  chestProgress: [],
  isLoading: true,
  refreshArenaData: async () => {},
  openChest: async () => false,
  getHeroPieces: async () => [],
  getHeroCompletion: () => 0,
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
  const [chestProgress, setChestProgress] = useState<ChestProgress[]>([]);
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

      // Sandık ilerlemelerini getir
      const { data: chestData } = await supabase
        .from("chest_progress")
        .select("*")
        .eq("user_id", user.id);

      if (chestData) setChestProgress(chestData);
    } catch (error) {
      console.error("Arena verileri yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openChest = async (arenaId: number, segmentIndex: number) => {
    if (!user) return false;

    try {
      // Chest durumunu "opened" olarak güncelle
      const { error: updateError } = await supabase
        .from("chest_progress")
        .update({
          status: "opened",
          opened_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("arena_id", arenaId)
        .eq("segment_index", segmentIndex)
        .eq("status", "available");

      if (updateError) throw updateError;

      // Arena'daki kahramanı bul
      const arena = arenas.find((a) => a.id === arenaId);
      if (!arena) return false;

      // Kahraman parçalarını getir
      const { data: existingPieces } = await supabase
        .from("hero_pieces")
        .select("piece_index")
        .eq("user_id", user.id)
        .eq("hero_name", arena.hero_name);

      const existingIndices = existingPieces?.map((p) => p.piece_index) || [];
      const allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      const availableIndices = allIndices.filter(
        (i) => !existingIndices.includes(i),
      );

      if (availableIndices.length === 0) {
        // Tüm parçalar toplanmış, ek bir ödül verilebilir (örneğin 100 kupa)
        console.log("Tüm parçalar toplanmış!");
        return true;
      }

      // Rastgele bir parça seç
      const randomIndex =
        availableIndices[Math.floor(Math.random() * availableIndices.length)];

      // Parçayı ekle
      const { error: insertError } = await supabase.from("hero_pieces").insert({
        user_id: user.id,
        hero_name: arena.hero_name,
        piece_index: randomIndex,
      });

      if (insertError) throw insertError;

      await refreshArenaData();
      return true;
    } catch (error) {
      console.error("Sandık açılırken hata:", error);
      return false;
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

  const getHeroCompletion = (heroName: string): number => {
    const pieces = chestProgress.filter(
      (c) => arenas.find((a) => a.id === c.arena_id)?.hero_name === heroName,
    );
    // Bu fonksiyon daha karmaşık olabilir, şimdilik basit tutalım
    return 0;
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
        chestProgress,
        isLoading,
        refreshArenaData,
        openChest,
        getHeroPieces,
        getHeroCompletion,
        getCurrentArenaHero,
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
};
