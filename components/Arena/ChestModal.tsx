import CustomText from "@components/CustomText";
import { useArena } from "@contexts/ArenaContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

interface ChestModalProps {
  visible: boolean;
  onClose: () => void;
  arenaId: number;
  segmentIndex: number;
  arenaName: string;
  heroName: string;
  onRewardClaimed: () => void;
}

export default function ChestModal({
  visible,
  onClose,
  arenaId,
  segmentIndex,
  arenaName,
  heroName,
  onRewardClaimed,
}: ChestModalProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const { openChest } = useArena();

  const [isOpening, setIsOpening] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardPieceIndex, setRewardPieceIndex] = useState<number | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rewardScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsOpening(false);
      setShowReward(false);
      setRewardPieceIndex(null);
      setIsClaimed(false);
    }
  }, [visible]);

  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startGlowAnimation = () => {
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleOpenChest = async () => {
    if (isOpening || isClaimed) return;

    setIsOpening(true);
    startShakeAnimation();

    // Şişme animasyonu
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // Sandığı aç
      const success = await openChest(arenaId, segmentIndex);

      if (success) {
        // Rastgele bir parça indeksi (0-8)
        const randomPiece = Math.floor(Math.random() * 9);
        setRewardPieceIndex(randomPiece);
        setShowReward(true);
        startGlowAnimation();

        // Ödül animasyonu
        Animated.spring(rewardScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      } else {
        setIsOpening(false);
        scaleAnim.setValue(1);
      }
    });
  };

  const handleClaimReward = () => {
    if (isClaimed) return;

    setIsClaimed(true);
    Animated.timing(rewardScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onRewardClaimed();
      onClose();
    });
  };

  const getPieceNumber = (index: number) => {
    return (index + 1).toString();
  };

  const translateX = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-10, 10],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              transform: [{ translateX }, { scale: scaleAnim }],
            },
          ]}
        >
          {!showReward ? (
            // Sandık Kapalı Durumu
            <>
              <Animated.View
                style={[
                  styles.chestIconContainer,
                  {
                    backgroundColor: colors.primary + "20",
                    shadowColor: colors.primary,
                    shadowOpacity: glowOpacity,
                  },
                ]}
              >
                <Ionicons name="gift" size={scale(60)} color={colors.primary} />
              </Animated.View>

              <CustomText style={[styles.modalTitle, { color: colors.text }]}>
                {arenaName} Sandığı
              </CustomText>

              <CustomText
                style={[styles.modalMessage, { color: colors.text + "80" }]}
              >
                Bu sandıkta {heroName} kahramanının bir parçası bulunuyor. Açmak
                ister misin?
              </CustomText>

              <TouchableOpacity
                style={[
                  styles.openButton,
                  {
                    backgroundColor: colors.primary,
                    marginTop: scale(20),
                    paddingVertical: scale(14),
                    borderRadius: scale(28),
                  },
                ]}
                onPress={handleOpenChest}
                disabled={isOpening}
              >
                <CustomText style={[styles.openButtonText, { color: "white" }]}>
                  {isOpening ? "Açılıyor..." : "Sandığı Aç"}
                </CustomText>
              </TouchableOpacity>
            </>
          ) : (
            // Ödül Gösterimi
            <Animated.View
              style={[
                styles.rewardContainer,
                { transform: [{ scale: rewardScaleAnim }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.rewardIconContainer,
                  {
                    backgroundColor: colors.primary + "20",
                    shadowColor: colors.primary,
                    shadowOpacity: glowOpacity,
                  },
                ]}
              >
                <Ionicons
                  name="diamond"
                  size={scale(50)}
                  color={colors.primary}
                />
              </Animated.View>

              <CustomText style={[styles.rewardTitle, { color: colors.text }]}>
                Tebrikler!
              </CustomText>

              <CustomText
                style={[styles.rewardMessage, { color: colors.text + "80" }]}
              >
                {heroName} Kahraman Parçası #
                {getPieceNumber(rewardPieceIndex || 0)} kazandınız!
              </CustomText>

              <View
                style={[
                  styles.pieceCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="medal"
                  size={scale(32)}
                  color={colors.primary}
                />
                <View style={styles.pieceInfo}>
                  <CustomText
                    style={[styles.pieceHeroName, { color: colors.text }]}
                  >
                    {heroName}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.pieceNumber,
                      { color: colors.primary, fontSize: scale(20) },
                    ]}
                  >
                    Parça #{getPieceNumber(rewardPieceIndex || 0)}
                  </CustomText>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.claimButton,
                  {
                    backgroundColor: colors.primary,
                    marginTop: scale(20),
                    paddingVertical: scale(14),
                    borderRadius: scale(28),
                  },
                ]}
                onPress={handleClaimReward}
              >
                <CustomText
                  style={[styles.claimButtonText, { color: "white" }]}
                >
                  Ödülü Al
                </CustomText>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  chestIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: "600",
    fontSize: 20,
    marginBottom: 8,
  },
  modalMessage: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 14,
  },
  openButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  openButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  rewardContainer: {
    alignItems: "center",
    width: "100%",
  },
  rewardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  rewardTitle: {
    fontWeight: "600",
    fontSize: 20,
    marginBottom: 8,
  },
  rewardMessage: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  pieceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
    marginBottom: 16,
  },
  pieceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pieceHeroName: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  pieceNumber: {
    fontWeight: "bold",
  },
  claimButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  claimButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
});
