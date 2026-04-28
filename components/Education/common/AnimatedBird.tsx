import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

interface AnimatedBirdProps {
  size?: number;
  triggerAnimation: boolean;
  animationType?: "correct" | "wrong" | "complete";
  onAnimationComplete?: () => void;
  gifDuration?: number;
}

export default function AnimatedBird({
  size = 140, // Daha büyük (100 -> 140)
  triggerAnimation,
  animationType = "correct",
  onAnimationComplete,
  gifDuration = 1500,
}: AnimatedBirdProps) {
  const { scale } = useResponsive();
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentGif, setCurrentGif] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animationTimerRef = useRef<number | null>(null);

  // GIF kaynakları
  const gifSources = {
    correct: require("@assets/images/mascot/bird-correct.gif"),
    wrong: require("@assets/images/mascot/bird-wrong.gif"),
    complete: require("@assets/images/mascot/bird-complete.gif"),
  };

  // Önceki timer'ı temizle
  const clearAnimationTimer = () => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (triggerAnimation && !showAnimation) {
      console.log(`🎬 Kuş animasyonu başlıyor: ${animationType}`);

      // Önceki animasyonu temizle
      clearAnimationTimer();
      fadeAnim.setValue(1);

      // GIF'i seç ve göster - AYNI ANDA her iki görsel de gösterilmiyor
      setCurrentGif(gifSources[animationType]);
      setShowAnimation(true);

      // GIF süresi kadar bekle
      const timerId = setTimeout(() => {
        console.log("🎬 Kuş animasyonu bitiyor");

        // Yumuşak geçiş
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Önce GIF'i kaldır, SONRA PNG görünsün (kesintisiz geçiş)
          setShowAnimation(false);
          setCurrentGif(null);
          fadeAnim.setValue(1);
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        });
      }, gifDuration);

      animationTimerRef.current = timerId as unknown as number;
    }

    return () => clearAnimationTimer();
  }, [triggerAnimation, animationType]);

  return (
    <View
      style={[styles.container, { width: scale(size), height: scale(size) }]}
    >
      {/* Arka planda her zaman PNG durur (ama görünürlüğü animasyonla kontrol edilir) */}
      <View style={[StyleSheet.absoluteFill, styles.imageWrapper]}>
        <Image
          source={require("@assets/images/mascot/bird.png")}
          style={[
            styles.image,
            {
              width: scale(size),
              height: scale(size),
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Animasyon GIF'i (animasyon sırasında PNG'nin üstünde gösterilir) */}
      {showAnimation && currentGif && (
        <Animated.View
          style={[
            styles.animationContainer,
            {
              opacity: fadeAnim,
              width: scale(size),
              height: scale(size),
            },
          ]}
        >
          <Image
            source={currentGif}
            style={[
              styles.gif,
              {
                width: scale(size),
                height: scale(size),
              },
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    // Taşmayı engelle
    overflow: "hidden",
  },
  imageWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    // Kenar boşluklarını azaltmak için biraz scale yap
    transform: [{ scale: 1.1 }],
  },
  animationContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  gif: {
    // Kenar boşluklarını azaltmak için biraz scale yap
    transform: [{ scale: 1.1 }],
  },
});
