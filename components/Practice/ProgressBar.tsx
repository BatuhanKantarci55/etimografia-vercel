import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface ProgressBarProps {
  progress: number; // 0-1 arası değer
  color?: string; // Opsiyonel renk parametresi
  showComboText?: boolean; // Kombo yazısı gösterilsin mi?
}

export default function ProgressBar({
  progress,
  color,
  showComboText = false,
}: ProgressBarProps) {
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
            height: scale(isDesktop ? 10 : 16),
            borderRadius: scale(isDesktop ? 5 : 8),
            overflow: "hidden",
            justifyContent: "center",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: widthInterpolation,
              backgroundColor: color || colors.primary,
              // DEĞİŞİKLİK: Masaüstünde ilerleme çubuğu dolgu kalınlığı küçültüldü
              height: scale(isDesktop ? 10 : 16),
              borderRadius: scale(isDesktop ? 5 : 8),
            },
          ]}
        />

        {showComboText && (
          <Animated.View
            style={[styles.comboTextContainer, { width: widthInterpolation }]}
          >
            <CustomText
              style={[
                styles.comboText,
                // DEĞİŞİKLİK: Masaüstünde kombo yazısı boyutu küçültüldü
                { color: "white", fontSize: scale(isDesktop ? 9 : 12) },
              ]}
            >
              KOMBO!
            </CustomText>
          </Animated.View>
        )}
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
    position: "relative",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  comboTextContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  comboText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});
