// components/GoldRewardModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getGoldColor } from "../constants/MoneyColors";
import { useGoldReward } from "../contexts/GoldRewardContext";
import { useTheme } from "../contexts/ThemeContext";
import CustomText from "./CustomText";

interface GoldRewardModalProps {
  visible: boolean;
  onComplete: () => void;
  level: number;
}

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(width * 0.08, 60);

export default function GoldRewardModal({
  visible,
  onComplete,
  level,
}: GoldRewardModalProps) {
  const { colors, themeMode } = useTheme();
  const goldReward = useGoldReward();

  // Animasyon değerleri
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const totalScaleAnim = useRef(new Animated.Value(1)).current;
  const [animatingCircleIndex, setAnimatingCircleIndex] = useState<
    number | null
  >(null);
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    if (visible) {
      goldReward.startReward();
      setDisplayTotal(0);
    }
  }, [visible]);

  // goldReward.totalGold değiştiğinde animasyonlu güncelleme yap
  useEffect(() => {
    if (goldReward.totalGold !== displayTotal) {
      // Toplam animasyonu
      Animated.sequence([
        Animated.timing(totalScaleAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(totalScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setDisplayTotal(goldReward.totalGold);
    }
  }, [goldReward.totalGold]);

  const handleTapAnywhere = () => {
    if (!goldReward.isComplete) {
      // Açılacak dairenin index'ini al
      const circleToOpen = goldReward.currentIndex;
      // Daireyi aç ve değeri al
      const value = goldReward.openNextCircle();

      if (value !== null) {
        // Daire animasyonu
        setAnimatingCircleIndex(circleToOpen);
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setAnimatingCircleIndex(null);
        });
      }
    }
  };

  const handleNext = () => {
    onComplete();
  };

  // Daireleri 5x2 grid olarak düzenle
  const renderCirclesInGrid = () => {
    const rows = [];
    const circlesPerRow = 5;

    for (let i = 0; i < goldReward.circles; i += circlesPerRow) {
      const rowCircles = [];
      for (
        let j = i;
        j < Math.min(i + circlesPerRow, goldReward.circles);
        j++
      ) {
        const idx = j;
        const isOpened = idx < goldReward.currentIndex;
        const isAnimating = animatingCircleIndex === idx;
        const value = goldReward.rewards[idx];
        const circleColor =
          isOpened && value
            ? getGoldColor(value, themeMode)
            : colors.background;

        rowCircles.push(
          <Animated.View
            key={idx}
            style={[
              styles.circle,
              {
                backgroundColor: isOpened ? circleColor : colors.background,
                borderColor: colors.border,
                borderWidth: isOpened ? 0 : 2,
                transform: [{ scale: isAnimating ? scaleAnim : 1 }],
              },
            ]}
          >
            {isOpened && (
              <CustomText style={[styles.circleText, { color: "white" }]}>
                {value}
              </CustomText>
            )}
          </Animated.View>,
        );
      }
      rows.push(
        <View key={`row-${i}`} style={styles.circleRow}>
          {rowCircles}
        </View>,
      );
    }
    return rows;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.8)" }]}>
        <TouchableOpacity
          style={styles.container}
          activeOpacity={1}
          onPress={handleTapAnywhere}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Toplam Altın - Üstte (Animasyonlu) */}
            <View style={styles.totalContainer}>
              <CustomText
                style={[styles.totalLabel, { color: colors.text + "80" }]}
              >
                Toplam Altın
              </CustomText>
              <Animated.View style={{ transform: [{ scale: totalScaleAnim }] }}>
                <CustomText
                  style={[styles.totalAmount, { color: colors.primary }]}
                >
                  {displayTotal}
                </CustomText>
              </Animated.View>
            </View>

            {/* Daireler Gridi */}
            <View style={styles.circlesGrid}>{renderCirclesInGrid()}</View>

            {!goldReward.isComplete ? (
              <CustomText
                style={[styles.tapHint, { color: colors.text + "80" }]}
              >
                Ekranda herhangi bir yere dokunun
              </CustomText>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: colors.primary }]}
                onPress={handleNext}
              >
                <CustomText style={styles.nextButtonText}>
                  Elmas Ödülüne Geç
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    maxWidth: 500,
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 24,
  },
  totalContainer: {
    alignItems: "center",
    gap: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: "bold",
  },
  circlesGrid: {
    alignItems: "center",
    gap: 12,
  },
  circleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  circleText: {
    fontSize: CIRCLE_SIZE * 0.35,
    fontWeight: "bold",
  },
  tapHint: {
    fontSize: 14,
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  nextButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
