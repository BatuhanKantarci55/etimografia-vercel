import heroesData from "@assets/data/heroes.json";
import { supabase } from "@lib/supabase";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type Hero = {
  name: string;
  displayName: string;
  description: string;
  abilityName: string;
  abilityDescription: string;
  duration: number | null;
  cooldown: number | null;
  maxUses: number | null;
  guild: "wisdom" | "war" | "structure";
  compatibleModes: ("multiple-choice" | "classic")[];
  effect: any;
};

export type HeroSlot = {
  slotType: "multiple-choice" | "classic";
  heroName: string | null;
};

type HeroContextType = {
  heroes: Hero[];
  getHeroByName: (name: string) => Hero | undefined;
  userHeroPieces: Map<string, number[]>;
  userSlots: HeroSlot[];
  isLoading: boolean;
  refreshHeroData: () => Promise<void>;
  isHeroUnlocked: (heroName: string) => boolean;
  getHeroPieceCount: (heroName: string) => number;
  selectHeroForSlot: (
    heroName: string,
    slotType: "multiple-choice" | "classic",
  ) => Promise<boolean>;
  getSlotHero: (
    slotType: "multiple-choice" | "classic",
  ) => Hero | null | undefined;
};

const HeroContext = createContext<HeroContextType>({
  heroes: [],
  getHeroByName: () => undefined,
  userHeroPieces: new Map(),
  userSlots: [],
  isLoading: true,
  refreshHeroData: async () => {},
  isHeroUnlocked: () => false,
  getHeroPieceCount: () => 0,
  selectHeroForSlot: async () => false,
  getSlotHero: () => null,
});

export const useHero = () => useContext(HeroContext);

export const HeroProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  // heroesData.heroes yerine doğrudan heroesData kullan (eğer heroes.json direkt array ise)
  // veya heroesData as any ile tip hatasını geçici olarak çöz
  const [heroes] = useState<Hero[]>((heroesData as any).heroes || heroesData);
  const [userHeroPieces, setUserHeroPieces] = useState<Map<string, number[]>>(
    new Map(),
  );
  const [userSlots, setUserSlots] = useState<HeroSlot[]>([
    { slotType: "multiple-choice", heroName: null },
    { slotType: "classic", heroName: null },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const getHeroByName = (name: string) => {
    return heroes.find((h) => h.name === name);
  };

  const refreshHeroData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Kullanıcının kahraman parçalarını getir
      const { data: piecesData } = await supabase
        .from("hero_pieces")
        .select("hero_name, piece_index")
        .eq("user_id", user.id);

      const piecesMap = new Map<string, number[]>();
      piecesData?.forEach((piece) => {
        const existing = piecesMap.get(piece.hero_name) || [];
        piecesMap.set(piece.hero_name, [...existing, piece.piece_index]);
      });
      setUserHeroPieces(piecesMap);

      // Kullanıcının slotlarını getir
      const { data: slotsData } = await supabase
        .from("hero_slots")
        .select("slot_type, hero_name")
        .eq("user_id", user.id);

      if (slotsData && slotsData.length > 0) {
        setUserSlots([
          {
            slotType: "multiple-choice",
            heroName:
              slotsData.find((s) => s.slot_type === "multiple-choice")
                ?.hero_name || null,
          },
          {
            slotType: "classic",
            heroName:
              slotsData.find((s) => s.slot_type === "classic")?.hero_name ||
              null,
          },
        ]);
      }
    } catch (error) {
      console.error("Kahraman verileri yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isHeroUnlocked = (heroName: string): boolean => {
    const pieces = userHeroPieces.get(heroName) || [];
    return pieces.length === 9;
  };

  const getHeroPieceCount = (heroName: string): number => {
    return userHeroPieces.get(heroName)?.length || 0;
  };

  const selectHeroForSlot = async (
    heroName: string,
    slotType: "multiple-choice" | "classic",
  ): Promise<boolean> => {
    if (!user) return false;

    const hero = getHeroByName(heroName);
    if (!hero) return false;

    // Hero bu slot tipiyle uyumlu mu?
    if (!hero.compatibleModes.includes(slotType)) return false;

    try {
      // Önce mevcut slotu sil (upsert yapmak için)
      const { error: deleteError } = await supabase
        .from("hero_slots")
        .delete()
        .eq("user_id", user.id)
        .eq("slot_type", slotType);

      if (deleteError) throw deleteError;

      // Yeni kahramanı ekle
      const { error: insertError } = await supabase.from("hero_slots").insert({
        user_id: user.id,
        slot_type: slotType,
        hero_name: heroName,
      });

      if (insertError) throw insertError;

      await refreshHeroData();
      return true;
    } catch (error) {
      console.error("Kahraman slotu güncellenirken hata:", error);
      return false;
    }
  };

  const getSlotHero = (slotType: "multiple-choice" | "classic") => {
    const slot = userSlots.find((s) => s.slotType === slotType);
    if (!slot?.heroName) return null;
    return getHeroByName(slot.heroName);
  };

  useEffect(() => {
    refreshHeroData();
  }, [user]);

  return (
    <HeroContext.Provider
      value={{
        heroes,
        getHeroByName,
        userHeroPieces,
        userSlots,
        isLoading,
        refreshHeroData,
        isHeroUnlocked,
        getHeroPieceCount,
        selectHeroForSlot,
        getSlotHero,
      }}
    >
      {children}
    </HeroContext.Provider>
  );
};
