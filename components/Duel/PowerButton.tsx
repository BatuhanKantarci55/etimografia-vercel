import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  onPress: () => void;
  isActive: boolean; // rakip kulesinde parça var mı?
  cooldownUntil: Date | null;
  disabled?: boolean;
}

export default function PowerButton({
  onPress,
  isActive,
  cooldownUntil,
  disabled = false,
}: Props) {
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const [cooldownSec, setCooldownSec] = useState(0);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (cooldownUntil) {
      const update = () => {
        const now = Date.now();
        const end = cooldownUntil.getTime();
        const rem = Math.max(0, Math.floor((end - now) / 1000));
        setCooldownSec(rem);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setCooldownSec(0);
    }
  }, [cooldownUntil]);

  useEffect(() => {
    if (isActive && !cooldownSec && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isActive, cooldownSec, disabled]);

  const buttonDisabled = disabled || !isActive || cooldownSec > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={buttonDisabled}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: buttonDisabled ? colors.card + "80" : colors.card,
            borderColor: colors.primary,
            transform: [{ scale: pulseAnim }],
            width: scale(60),
            height: scale(60),
            borderRadius: scale(30),
          },
        ]}
      >
        <Ionicons
          name="flame"
          size={scale(30)}
          color={buttonDisabled ? colors.text + "40" : colors.primary}
        />
        {cooldownSec > 0 && (
          <View
            style={[
              styles.cooldown,
              {
                backgroundColor: colors.background + "CC",
                width: scale(60),
                height: scale(60),
                borderRadius: scale(30),
              },
            ]}
          >
            <CustomText
              style={[
                styles.cooldownText,
                { color: colors.text, fontSize: scale(14) },
              ]}
            >
              {cooldownSec}
            </CustomText>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", bottom: 100, right: 20, zIndex: 100 },
  button: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cooldown: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  cooldownText: { fontWeight: "bold" },
});
