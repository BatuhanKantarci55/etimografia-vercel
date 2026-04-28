import { Audio } from "expo-av";
import { useCallback, useRef } from "react";

type SoundType = "correct" | "wrong" | "complete" | "combo";

export const useSound = () => {
  const soundRef = useRef<Audio.Sound | null>(null);

  const playSound = useCallback(async (type: SoundType) => {
    try {
      // Önceki ses varsa durdur ve boşalt
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Ses dosyasını yükle
      let soundFile;
      switch (type) {
        case "correct":
          soundFile = require("@assets/sounds/correct.mp3");
          break;
        case "wrong":
          soundFile = require("@assets/sounds/wrong.mp3");
          break;
        case "complete":
          soundFile = require("@assets/sounds/complete.mp3");
          break;
        case "combo":
          soundFile = require("@assets/sounds/combo.mp3");
          break;
      }

      const { sound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
        volume: 1.0,
      });

      soundRef.current = sound;

      // Ses bittiğinde kaynağı temizle
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  }, []);

  return { playSound };
};
