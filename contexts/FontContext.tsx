import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { createContext, useContext, useEffect, useState } from "react";

// FontContext tipi
type FontContextType = {
  fontsLoaded: boolean;
  loadFonts: () => Promise<void>;
};

const FontContext = createContext<FontContextType>({
  fontsLoaded: false,
  loadFonts: async () => {},
});

export const useFonts = () => useContext(FontContext);

export const FontProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const loadFonts = async () => {
    try {
      await SplashScreen.preventAutoHideAsync();

      await Font.loadAsync({
        "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
        "Nunito-Medium": require("../assets/fonts/Nunito-Medium.ttf"),
        "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
      });

      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error("Font yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    loadFonts();
  }, []);

  return (
    <FontContext.Provider value={{ fontsLoaded, loadFonts }}>
      {children}
    </FontContext.Provider>
  );
};
