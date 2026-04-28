import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
  soundEffects: boolean;
  setSoundEffects: (value: boolean) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    console.error(
      "❌ useSettings hook'u SettingsProvider içinde kullanılmalı!",
    );
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  console.log("⚙️ SettingsProvider başlatıldı");

  const [soundEffects, setSoundEffects] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log("📥 Ayarlar yükleniyor...");
        const savedSoundEffects = await AsyncStorage.getItem("soundEffects");
        const savedNotifications = await AsyncStorage.getItem("notifications");

        if (savedSoundEffects !== null) {
          setSoundEffects(JSON.parse(savedSoundEffects));
          console.log("🔊 Ses efekti ayarı:", JSON.parse(savedSoundEffects));
        }
        if (savedNotifications !== null) {
          setNotifications(JSON.parse(savedNotifications));
          console.log("🔔 Bildirim ayarı:", JSON.parse(savedNotifications));
        }
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error);
      } finally {
        setIsLoaded(true);
        console.log("✅ Ayarlar yüklendi");
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem("soundEffects", JSON.stringify(soundEffects));
      console.log("💾 Ses efekti kaydedildi:", soundEffects);
    }
  }, [soundEffects, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem("notifications", JSON.stringify(notifications));
      console.log("💾 Bildirim kaydedildi:", notifications);
    }
  }, [notifications, isLoaded]);

  return (
    <SettingsContext.Provider
      value={{
        soundEffects,
        setSoundEffects,
        notifications,
        setNotifications,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
