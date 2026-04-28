import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";

interface OptionButtonProps {
  label: string;
  onPress: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  showResult?: boolean;
  disabled?: boolean;
  simpleMode?: boolean;
  shortcutKey?: string; // DEĞİŞİKLİK: Klavye kısayolunu gösterebilmek için eklendi
}

export default function OptionButton({
  label,
  onPress,
  isSelected = false,
  isCorrect = false,
  showResult = false,
  disabled = false,
  simpleMode = false,
  shortcutKey, // DEĞİŞİKLİK
}: OptionButtonProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const prevShowResultRef = useRef(showResult);
  const prevIsSelectedRef = useRef(isSelected);

  useEffect(() => {
    if (
      prevShowResultRef.current !== showResult ||
      prevIsSelectedRef.current !== isSelected
    ) {
      console.log(
        `🎨 OptionButton [${label}] - showResult: ${showResult}, isSelected: ${isSelected}, isCorrect: ${isCorrect}`,
      );
    }

    prevShowResultRef.current = showResult;
    prevIsSelectedRef.current = isSelected;
  }, [showResult, isSelected, isCorrect, label]);

  useEffect(() => {
    if (showResult && isSelected) {
      console.log(`✨ OptionButton [${label}] - Animasyonlar başlıyor`);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateXAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log(`✅ OptionButton [${label}] - Animasyonlar tamamlandı`);
      });
    } else {
      opacityAnim.setValue(0);
      translateXAnim.setValue(0);
    }
  }, [showResult, isSelected, label]);

  const getBackgroundColor = () => {
    if (!showResult) {
      return colors.card;
    }
    if (isSelected && isCorrect) {
      return "#4CAF50";
    }
    if (isSelected && !isCorrect) {
      return "#F44336";
    }
    if (!isSelected && isCorrect) {
      return "#4CAF50";
    }
    return colors.card;
  };

  const getTextColor = () => {
    if (!showResult) return colors.text;
    if (isCorrect) return "white";
    if (isSelected && !isCorrect) return "white";
    return colors.text;
  };

  const getIcon = (): "checkmark" | "close" | undefined => {
    if (!showResult || !isSelected) return undefined;
    return isCorrect ? "checkmark" : "close";
  };

  const iconName = getIcon();

  // DEĞİŞİKLİK: Masaüstünde daha az kayma miktarı
  const slideAmount = scale(isDesktop ? 10 : 14);

  const animatedLabelStyle = {
    transform: [
      {
        translateX: translateXAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, slideAmount],
        }),
      },
    ],
  };

  const animatedIconStyle = {
    opacity: opacityAnim,
    transform: [
      {
        scale: opacityAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      onPress={() => {
        console.log(`👆 OptionButton [${label}] - Tıklandı`);
        onPress();
      }}
      disabled={disabled || (showResult && simpleMode)}
      activeOpacity={0.7}
      style={{ width: "100%" }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(),
            // DEĞİŞİKLİK: Masaüstünde şık kavisleri daraltıldı
            borderRadius: scale(isDesktop ? 6 : 12),
            // DEĞİŞİKLİK: Masaüstünde şık yükseklikleri (padding) daha da daraltıldı
            paddingVertical: scale(isDesktop ? 8 : 16),
            paddingHorizontal: scale(isDesktop ? 8 : 12),
            minHeight: scale(isDesktop ? 32 : 56),
          },
        ]}
      >
        {iconName && (
          <Animated.View
            style={[
              styles.iconContainer,
              animatedIconStyle,
              {
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                width: scale(isDesktop ? 18 : 28),
                height: scale(isDesktop ? 18 : 28),
                borderRadius: scale(isDesktop ? 9 : 14),
                position: "absolute",
                left: scale(isDesktop ? 8 : 12),
              },
            ]}
          >
            <Ionicons
              name={iconName}
              size={scale(isDesktop ? 12 : 18)}
              color="white"
            />
          </Animated.View>
        )}

        <Animated.View style={[styles.labelContainer, animatedLabelStyle]}>
          <CustomText
            style={[
              styles.label,
              {
                color: getTextColor(),
                fontSize: scale(isDesktop ? 11 : 16),
                textAlign: "center",
              },
            ]}
          >
            {label}
          </CustomText>
        </Animated.View>

        {/* DEĞİŞİKLİK: Masaüstü görünümünde klavye kısayol tuşu ipucunu göster */}
        {isDesktop && shortcutKey && !showResult && (
          <View
            style={[
              styles.shortcutBadge,
              { backgroundColor: colors.text + "15" },
            ]}
          >
            <CustomText
              style={{
                fontSize: scale(9),
                color: colors.text + "60",
                fontWeight: "bold",
              }}
            >
              {shortcutKey}
            </CustomText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "relative",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "500",
  },
  // DEĞİŞİKLİK: Kısayol rozeti tasarımı
  shortcutBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
