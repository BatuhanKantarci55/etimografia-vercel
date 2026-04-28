import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

interface TimerProps {
  initialSeconds: number;
  onTimeOut: () => void;
  isActive: boolean;
  addedTime?: number; // Eklenecek süre (animasyon için)
}

export default function Timer({
  initialSeconds,
  onTimeOut,
  isActive,
  addedTime = 0,
}: TimerProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const [seconds, setSeconds] = useState(initialSeconds);
  const addedTimeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<number | null>(null);

  // Süreyi MM:SS formatına çevir
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Süre eklendiğinde animasyon - sadece yukarı çıkıp kaybol
  useEffect(() => {
    if (addedTime > 0) {
      // Önceki animasyonu iptal et
      addedTimeAnim.stopAnimation();
      addedTimeAnim.setValue(0);

      // Yeni animasyon - sadece yukarı çık ve opaklığı azal
      Animated.timing(addedTimeAnim, {
        toValue: 1,
        duration: 800, // Daha yavaş (300 -> 800)
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [addedTime]);

  // Sayaç mantığı
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isActive && seconds > 0) {
      timerRef.current = setTimeout(() => {
        setSeconds((prev) => prev - 1);
      }, 1000) as unknown as number;
    } else if (seconds === 0) {
      onTimeOut();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [seconds, isActive, onTimeOut]);

  // addedTime değiştiğinde süreyi artır
  useEffect(() => {
    if (addedTime > 0) {
      setSeconds((prev) => prev + addedTime);
    }
  }, [addedTime]);

  // initialSeconds değiştiğinde sıfırla
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  // Rengi belirle (son 10 saniye kırmızı)
  const getTimerColor = () => {
    if (seconds <= 10) return "#F44336";
    return colors.primary;
  };

  // Animasyonlu +1 efekti - sadece yukarı çık ve opaklığı azal
  const translateY = addedTimeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30], // Biraz daha yukarı
  });

  const opacity = addedTimeAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.5, 0], // Yavaşça opaklığı azal
  });

  return (
    <View style={styles.container}>
      <Ionicons
        name="time-outline"
        // DEĞİŞİKLİK: Masaüstü için saat ikonu küçültüldü
        size={scale(isDesktop ? 16 : 24)}
        color={getTimerColor()}
      />
      <CustomText
        style={[
          styles.timerText,
          {
            color: getTimerColor(),
            // DEĞİŞİKLİK: Masaüstü için saat rakam fontu küçültüldü
            fontSize: scale(isDesktop ? 14 : 20),
            marginLeft: scale(4),
          },
        ]}
      >
        {formatTime(seconds)}
      </CustomText>

      {/* +1 animasyonu */}
      {addedTime > 0 && (
        <Animated.View
          style={[
            styles.addedTimeContainer,
            {
              transform: [{ translateY }],
              opacity,
              // DEĞİŞİKLİK: Masaüstünde sağa kayma miktarı ayarlandı
              left: scale(isDesktop ? 20 : 30), // Saat ikonunun yanında
            },
          ]}
        >
          <CustomText
            style={[
              styles.addedTimeText,
              // DEĞİŞİKLİK: Masaüstü için +1 yazısı küçültüldü
              { color: "#4CAF50", fontSize: scale(isDesktop ? 12 : 16) },
            ]}
          >
            +{addedTime}
          </CustomText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  timerText: {
    fontWeight: "600",
  },
  addedTimeContainer: {
    position: "absolute",
    top: -10,
  },
  addedTimeText: {
    fontWeight: "bold",
  },
});
