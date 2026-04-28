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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (addedTime > 0) {
      addedTimeAnim.stopAnimation();
      addedTimeAnim.setValue(0);

      Animated.timing(addedTimeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [addedTime]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isActive && seconds > 0) {
      timerRef.current = setTimeout(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      onTimeOut();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [seconds, isActive, onTimeOut]);

  useEffect(() => {
    if (addedTime > 0) {
      setSeconds((prev) => prev + addedTime);
    }
  }, [addedTime]);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const getTimerColor = () => {
    if (seconds <= 10) return "#F44336";
    return colors.primary;
  };

  const translateY = addedTimeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const opacity = addedTimeAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.5, 0],
  });

  return (
    <View style={styles.container}>
      <Ionicons
        name="time-outline"
        // DEĞİŞİKLİK: Masaüstü için ikon boyutu küçültüldü
        size={scale(isDesktop ? 16 : 24)}
        color={getTimerColor()}
      />
      <CustomText
        style={[
          styles.timerText,
          {
            color: getTimerColor(),
            // DEĞİŞİKLİK: Masaüstü için font boyutu küçültüldü
            fontSize: scale(isDesktop ? 14 : 20),
            marginLeft: scale(4),
          },
        ]}
      >
        {formatTime(seconds)}
      </CustomText>

      {addedTime > 0 && (
        <Animated.View
          style={[
            styles.addedTimeContainer,
            {
              transform: [{ translateY }],
              opacity,
              right: -scale(5),
            },
          ]}
        >
          <CustomText
            style={[
              styles.addedTimeText,
              // DEĞİŞİKLİK: Masaüstü için +1 font boyutu küçültüldü
              {
                color: "#4CAF50",
                fontSize: scale(isDesktop ? 12 : 16),
                fontWeight: "bold",
              },
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
