import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { View } from "react-native"; // View ve ActivityIndicator eklendi

export type GameMode = "education" | "practice" | "duel";

type GameModeContextType = {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => Promise<void>;
  isLoading: boolean;
};

const GameModeContext = createContext<GameModeContextType>({
  gameMode: "education",
  setGameMode: async () => {},
  isLoading: true,
});

export const useGameMode = () => useContext(GameModeContext);

const GAME_MODE_STORAGE_KEY = "@etimografya:gameMode";

export const GameModeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [gameMode, setGameModeState] = useState<GameMode>("education");
  const [isLoading, setIsLoading] = useState(true);

  // Uygulama açıldığında kayıtlı modu yükle
  useEffect(() => {
    loadSavedGameMode();
  }, []);

  const loadSavedGameMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(GAME_MODE_STORAGE_KEY);
      if (
        savedMode &&
        (savedMode === "education" ||
          savedMode === "practice" ||
          savedMode === "duel")
      ) {
        setGameModeState(savedMode as GameMode);
      }
    } catch (error) {
      console.error("Oyun modu yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setGameMode = async (mode: GameMode) => {
    try {
      await AsyncStorage.setItem(GAME_MODE_STORAGE_KEY, mode);
      setGameModeState(mode);
    } catch (error) {
      console.error("Oyun modu kaydedilirken hata:", error);
    }
  };

  // Eğer yükleniyorsa, children'ı göstermeden önce boş bir View göster
  // Bu, içeriğin doğrudan string olarak render edilmesini engeller
  if (isLoading) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <GameModeContext.Provider value={{ gameMode, setGameMode, isLoading }}>
      {children}
    </GameModeContext.Provider>
  );
};
