import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AppMode,
  colorSchemes,
  defaultAppMode,
  defaultTheme,
  ThemeMode,
} from "../constants/Colors";

type ThemeContextType = {
  themeMode: ThemeMode;
  appMode: AppMode;
  colors: any;
  toggleTheme: () => void;
  setAppMode: (mode: AppMode) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  themeMode: defaultTheme,
  appMode: defaultAppMode,
  colors: colorSchemes[defaultAppMode][defaultTheme],
  toggleTheme: () => {},
  setAppMode: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultTheme);
  const [appMode, setAppModeState] = useState<AppMode>(defaultAppMode);

  // Mevcut renk paletini al
  const colors = colorSchemes[appMode][themeMode];
  const isDark = themeMode === "dark";

  // AsyncStorage'dan temayı yükle
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("themeMode");
      const savedAppMode = await AsyncStorage.getItem("appMode");

      if (savedTheme) setThemeMode(savedTheme as ThemeMode);
      if (savedAppMode) setAppModeState(savedAppMode as AppMode);
    } catch (error) {
      console.error("Tema yüklenirken hata:", error);
    }
  };

  const toggleTheme = async () => {
    const newTheme: ThemeMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newTheme);
    await AsyncStorage.setItem("themeMode", newTheme);
  };

  const setAppMode = async (mode: AppMode) => {
    setAppModeState(mode);
    await AsyncStorage.setItem("appMode", mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        appMode,
        colors,
        toggleTheme,
        setAppMode,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
