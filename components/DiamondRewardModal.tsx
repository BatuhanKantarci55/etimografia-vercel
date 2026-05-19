// components/DiamondRewardModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getDiamondColor } from "../constants/MoneyColors";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useDiamondReward } from "../contexts/DiamondRewardContext";
import { useGoldReward } from "../contexts/GoldRewardContext";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";
import CustomText from "./CustomText";

interface DiamondRewardModalProps {
  visible: boolean;
  onComplete: () => void;
  level: number;
  goldCompleted: boolean;
}

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(width * 0.1, 70);

export default function DiamondRewardModal({
  visible,
  onComplete,
  level,
  goldCompleted,
}: DiamondRewardModalProps) {
  const { colors, themeMode } = useTheme();
  const diamondReward = useDiamondReward();
  const goldReward = useGoldReward();
  const { addGold, addDiamond, refresh } = useCurrency();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // Animasyon değerleri
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const totalScaleAnim = useRef(new Animated.Value(1)).current;
  const [animatingCircleIndex, setAnimatingCircleIndex] = useState<
    number | null
  >(null);
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    if (visible) {
      diamondReward.startReward();
      setDisplayTotal(0);
    }
  }, [visible]);

  // diamondReward.totalDiamond değiştiğinde animasyonlu güncelleme yap
  useEffect(() => {
    if (diamondReward.totalDiamond !== displayTotal) {
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

      setDisplayTotal(diamondReward.totalDiamond);
    }
  }, [diamondReward.totalDiamond]);

  const handleTapAnywhere = () => {
    if (!diamondReward.isComplete) {
      // Açılacak dairenin index'ini al
      const circleToOpen = diamondReward.currentIndex;
      // Daireyi aç ve değeri al
      const value = diamondReward.openNextCircle();

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

  const handleClaimRewards = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const goldAmount = goldReward.totalGold;
      const diamondAmount = diamondReward.totalDiamond;
      const goldCounts = goldReward.getCounts();
      const diamondCounts = diamondReward.getCounts();

      await addGold(goldAmount, goldCounts);
      await addDiamond(diamondAmount, diamondCounts);

      if (user) {
        const { error } = await supabase.from("level_rewards_opened").insert({
          user_id: user.id,
          level: level,
          gold_earned: goldAmount,
          diamond_earned: diamondAmount,
        });
        if (error) throw error;
      }

      await refresh();
      onComplete();
    } catch (err) {
      console.error("Ödül kayıt hatası:", err);
      Alert.alert("Hata", "Ödüller kaydedilemedi, lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  // Elmas daireleri (5 tane yan yana)
  const renderCircles = () => {
    const circles = [];
    for (let i = 0; i < diamondReward.circles; i++) {
      const isOpened = i < diamondReward.currentIndex;
      const isAnimating = animatingCircleIndex === i;
      const value = diamondReward.rewards[i];
      const circleColor =
        isOpened && value
          ? getDiamondColor(value, themeMode)
          : colors.background;

      circles.push(
        <Animated.View
          key={i}
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
    return circles;
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
            {/* Toplam Elmas - Üstte (Animasyonlu) */}
            <View style={styles.totalContainer}>
              <CustomText
                style={[styles.totalLabel, { color: colors.text + "80" }]}
              >
                Toplam Elmas
              </CustomText>
              <Animated.View style={{ transform: [{ scale: totalScaleAnim }] }}>
                <CustomText
                  style={[styles.totalAmount, { color: colors.primary }]}
                >
                  {displayTotal}
                </CustomText>
              </Animated.View>
            </View>

            {/* Daireler */}
            <View style={styles.circlesContainer}>{renderCircles()}</View>

            {!diamondReward.isComplete ? (
              <CustomText
                style={[styles.tapHint, { color: colors.text + "80" }]}
              >
                Ekranda herhangi bir yere dokunun
              </CustomText>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: colors.primary }]}
                onPress={handleClaimRewards}
                disabled={saving}
              >
                <CustomText style={styles.nextButtonText}>
                  {saving ? "Kaydediliyor..." : "Ödülleri Al"}
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
  circlesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
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
