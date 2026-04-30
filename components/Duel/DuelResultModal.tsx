import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  myResult: "win" | "loss" | "draw";
  myPieces: number;
  opponentPieces: number;
  myName: string;
  opponentName: string;
  myPoints: number;
  opponentPoints: number;
  onClose: () => void;
}

export default function DuelResultModal({
  visible,
  myResult,
  myPieces,
  opponentPieces,
  myName,
  opponentName,
  myPoints,
  opponentPoints,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  let title = "";
  let icon: keyof typeof Ionicons.glyphMap = "remove";
  let iconColor = colors.text;

  if (myResult === "draw") {
    title = "Düello Berabere Bitti!";
    icon = "remove";
    iconColor = colors.text;
  } else if (myResult === "win") {
    title = "Tebrikler, Kazandın!";
    icon = "trophy";
    iconColor = "#FFD700";
  } else if (myResult === "loss") {
    title = "Maalesef Kaybettin!";
    icon = "sad-outline";
    iconColor = "#F44336";
  }

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

  const myDetails = calculateDetails(myPieces, myResult);

  const opponentResult =
    myResult === "win" ? "loss" : myResult === "loss" ? "win" : "draw";
  const opponentDetails = calculateDetails(opponentPieces, opponentResult);

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
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card },
            isDesktop && { maxWidth: scale(400) },
          ]}
        >
          <Ionicons name={icon} size={scale(60)} color={iconColor} />
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </CustomText>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreRow}>
              <CustomText style={[styles.playerName, { color: colors.text }]}>
                {myName}
              </CustomText>
              <CustomText style={[styles.scoreText, { color: colors.text }]}>
                {myPieces} parça
              </CustomText>
            </View>
            <View style={styles.scoreRow}>
              <CustomText style={[styles.playerName, { color: colors.text }]}>
                {opponentName}
              </CustomText>
              <CustomText style={[styles.scoreText, { color: colors.text }]}>
                {opponentPieces} parça
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
                  Kule Bonusu (1×{myPieces}):
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
                {opponentName}:
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
