import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  winner: "player1" | "player2" | "draw" | null;
  isPlayer1: boolean;
  player1Pieces: number;
  player2Pieces: number;
  player1Name: string;
  player2Name: string;
  player1Points?: number;
  player2Points?: number;
  onClose: () => void;
}

export default function DuelResultModal({
  visible,
  winner,
  isPlayer1,
  player1Pieces,
  player2Pieces,
  player1Name,
  player2Name,
  player1Points = 0,
  player2Points = 0,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  let title = "";
  let icon: keyof typeof Ionicons.glyphMap = "remove";
  let iconColor = colors.text;

  if (winner === "draw") {
    title = "Düello Berabere Bitti!";
    icon = "remove";
    iconColor = colors.text;
  } else if (winner === "player1") {
    title = isPlayer1 ? "Tebrikler, Kazandın!" : "Maalesef Kaybettin!";
    icon = isPlayer1 ? "trophy" : "sad-outline";
    iconColor = isPlayer1 ? "#FFD700" : "#F44336";
  } else if (winner === "player2") {
    title = isPlayer1 ? "Maalesef Kaybettin!" : "Tebrikler, Kazandın!";
    icon = isPlayer1 ? "sad-outline" : "trophy";
    iconColor = isPlayer1 ? "#F44336" : "#FFD700";
  }

  const myPoints = isPlayer1 ? player1Points : player2Points;
  const opponentPoints = isPlayer1 ? player2Points : player1Points;

  // Yeni puan detaylarını hesapla
  const calculateDetails = (
    pieces: number,
    result: "win" | "loss" | "draw",
  ) => {
    const winLossPoints = result === "win" ? 30 : result === "loss" ? -15 : 0;
    const towerBonus = pieces * 1;
    return {
      winLossPoints,
      towerBonus,
      total: winLossPoints + towerBonus,
    };
  };

  const myResult = (() => {
    if (winner === "draw") return "draw";
    if (
      (isPlayer1 && winner === "player1") ||
      (!isPlayer1 && winner === "player2")
    )
      return "win";
    return "loss";
  })();

  const opponentResult = (() => {
    if (winner === "draw") return "draw";
    if (
      (isPlayer1 && winner === "player2") ||
      (!isPlayer1 && winner === "player1")
    )
      return "win";
    return "loss";
  })();

  const myDetails = calculateDetails(
    isPlayer1 ? player1Pieces : player2Pieces,
    myResult,
  );
  const opponentDetails = calculateDetails(
    isPlayer1 ? player2Pieces : player1Pieces,
    opponentResult,
  );

  const handleHomePress = () => {
    onClose();
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleHomePress}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Ionicons name={icon} size={scale(60)} color={iconColor} />
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </CustomText>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreRow}>
              <CustomText style={[styles.playerName, { color: colors.text }]}>
                {player1Name}
              </CustomText>
              <CustomText style={[styles.scoreText, { color: colors.text }]}>
                {player1Pieces} parça
              </CustomText>
            </View>
            <View style={styles.scoreRow}>
              <CustomText style={[styles.playerName, { color: colors.text }]}>
                {player2Name}
              </CustomText>
              <CustomText style={[styles.scoreText, { color: colors.text }]}>
                {player2Pieces} parça
              </CustomText>
            </View>
          </View>

          {/* Puan Detayları - Senin Puanın */}
          <View
            style={[
              styles.pointsCard,
              { backgroundColor: colors.background, marginBottom: scale(8) },
            ]}
          >
            <CustomText
              style={[
                styles.pointsTitle,
                { color: colors.primary, fontSize: scale(16) },
              ]}
            >
              SENİN PUANIN
            </CustomText>
            <View style={styles.pointsBreakdown}>
              {myDetails.winLossPoints !== 0 && (
                <View style={styles.pointsRow}>
                  <CustomText
                    style={[styles.pointsLabel, { color: colors.text }]}
                  >
                    {myResult === "win" ? "Galibiyet:" : "Mağlubiyet:"}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.pointsValue,
                      {
                        color: myResult === "win" ? "#4CAF50" : "#F44336",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {myDetails.winLossPoints > 0
                      ? `+${myDetails.winLossPoints}`
                      : myDetails.winLossPoints}
                  </CustomText>
                </View>
              )}
              {myResult === "draw" && (
                <View style={styles.pointsRow}>
                  <CustomText
                    style={[styles.pointsLabel, { color: colors.text }]}
                  >
                    Beraberlik:
                  </CustomText>
                  <CustomText
                    style={[styles.pointsValue, { color: colors.text }]}
                  >
                    0
                  </CustomText>
                </View>
              )}
              <View style={styles.pointsRow}>
                <CustomText
                  style={[styles.pointsLabel, { color: colors.text }]}
                >
                  Kule Bonusu (1×{isPlayer1 ? player1Pieces : player2Pieces}):
                </CustomText>
                <CustomText
                  style={[styles.pointsValue, { color: colors.text }]}
                >
                  +{myDetails.towerBonus}
                </CustomText>
              </View>
              <View
                style={[
                  styles.pointsRow,
                  styles.totalRow,
                  { borderTopColor: colors.border },
                ]}
              >
                <CustomText
                  style={[
                    styles.pointsLabel,
                    { color: colors.text, fontWeight: "bold" },
                  ]}
                >
                  TOPLAM:
                </CustomText>
                <CustomText
                  style={[
                    styles.pointsValue,
                    {
                      color: colors.primary,
                      fontWeight: "bold",
                      fontSize: scale(18),
                    },
                  ]}
                >
                  {myDetails.total > 0
                    ? `+${myDetails.total}`
                    : myDetails.total}
                </CustomText>
              </View>
            </View>
          </View>

          {/* Rakibin Puanı */}
          <View
            style={[styles.pointsCard, { backgroundColor: colors.background }]}
          >
            <CustomText
              style={[
                styles.pointsTitle,
                { color: colors.text + "80", fontSize: scale(14) },
              ]}
            >
              RAKİBİN PUANI
            </CustomText>
            <View style={styles.pointsRow}>
              <CustomText
                style={[styles.pointsLabel, { color: colors.text + "80" }]}
              >
                {player2Name}:
              </CustomText>
              <CustomText
                style={[
                  styles.pointsValue,
                  {
                    color:
                      opponentDetails.total > 0
                        ? colors.primary
                        : opponentDetails.total < 0
                          ? "#F44336"
                          : colors.text + "80",
                    fontWeight: "bold",
                  },
                ]}
              >
                {opponentDetails.total > 0
                  ? `+${opponentDetails.total}`
                  : opponentDetails.total}
              </CustomText>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.homeButton,
              {
                backgroundColor: colors.primary,
                marginTop: scale(20),
                paddingVertical: scale(14),
                borderRadius: scale(28),
                width: "100%",
              },
            ]}
            onPress={handleHomePress}
          >
            <CustomText style={[styles.homeButtonText, { color: "white" }]}>
              Ana Sayfaya Dön
            </CustomText>
          </TouchableOpacity>
        </View>
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
  modalTitle: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    fontSize: 20,
    textAlign: "center",
  },
  scoreContainer: { width: "100%", marginVertical: 16 },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  playerName: { fontSize: 16, fontWeight: "500" },
  scoreText: { fontSize: 16, fontWeight: "600" },
  pointsCard: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  pointsTitle: {
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  pointsBreakdown: {
    width: "100%",
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pointsLabel: { fontSize: 14 },
  pointsValue: { fontSize: 14, fontWeight: "500" },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  homeButton: { alignItems: "center", justifyContent: "center" },
  homeButtonText: { fontWeight: "600" },
});
