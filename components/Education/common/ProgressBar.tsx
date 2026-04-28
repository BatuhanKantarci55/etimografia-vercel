import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface ProgressBarProps {
  progress: number; // 0-1 arası değer
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const progressAnim = useRef(new Animated.Value(0)).current;
  const prevProgressRef = useRef(0);

  useEffect(() => {
    console.log(
      `📊 Progress bar güncelleniyor: ${prevProgressRef.current} -> ${progress}`,
    );

    if (prevProgressRef.current !== progress) {
      progressAnim.stopAnimation();

      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        console.log(`✅ Progress animasyon tamamlandı: ${progress}`);
      });

      prevProgressRef.current = progress;
    }
  }, [progress]);

  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.progressBar,
          {
            backgroundColor: colors.card,
            // DEĞİŞİKLİK: Masaüstünde ilerleme çubuğu kalınlığı küçültüldü
            height: scale(isDesktop ? 10 : 20),
            borderRadius: scale(isDesktop ? 5 : 10),
            overflow: "hidden",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthInterpolation,
              backgroundColor: colors.primary,
              // DEĞİŞİKLİK: Masaüstünde ilerleme çubuğu dolgu kalınlığı küçültüldü
              height: scale(isDesktop ? 10 : 20),
              borderRadius: scale(isDesktop ? 5 : 10),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  progressBar: {
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
});
