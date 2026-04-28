import CustomText from "@components/CustomText";
import { DuelRequest, useDuel } from "@contexts/DuelContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { getAvatarSource } from "@utils/avatarUtils";
import React, { useEffect, useState } from "react";
import { Image, Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  request: DuelRequest | null;
  onClose: () => void;
}

export default function InvitationModal({ visible, request, onClose }: Props) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();
  const { acceptInvite, rejectInvite } = useDuel();

  const [timeLeft, setTimeLeft] = useState(120);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!visible || !request) return;
    const expiresAt = new Date(request.expires_at).getTime();
    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) onClose();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [visible, request]);

  const handleAccept = async () => {
    if (!request || isProcessing) return;
    setIsProcessing(true);
    const success = await acceptInvite(request.id);
    setIsProcessing(false);
    if (success) onClose();
  };

  const handleReject = async () => {
    if (!request || isProcessing) return;
    setIsProcessing(true);
    await rejectInvite(request.id);
    setIsProcessing(false);
    onClose();
  };

  if (!request) return null;

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
  const gameTypeText =
    request.game_type === "multiple-choice" ? "Çoktan Seçmeli" : "Klasik";
  const directionText =
    request.direction === "old-to-new" ? "Eski → Yeni" : "Yeni → Eski";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              // DEĞİŞİKLİK: Masaüstü için modal penceresi küçültüldü
              borderRadius: scale(isDesktop ? 12 : 20),
              padding: scale(isDesktop ? 16 : 20),
              maxWidth: isDesktop ? scale(300) : 400,
            },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Ionicons
              name="git-compare"
              // DEĞİŞİKLİK: İkon boyutu küçültüldü
              size={scale(isDesktop ? 20 : 28)}
              color={colors.primary}
            />
            <CustomText
              style={[
                styles.modalTitle,
                {
                  color: colors.text,
                  // DEĞİŞİKLİK: Başlık boyutu küçültüldü
                  fontSize: scale(isDesktop ? 16 : 20),
                  marginLeft: scale(8),
                },
              ]}
            >
              Düello Daveti
            </CustomText>
          </View>

          <View style={styles.opponentContainer}>
            <Image
              source={getAvatarSource(request.sender?.avatar_index || 0)}
              style={[
                styles.opponentAvatar,
                {
                  // DEĞİŞİKLİK: Avatar boyutu küçültüldü
                  width: scale(isDesktop ? 40 : 60),
                  height: scale(isDesktop ? 40 : 60),
                  borderRadius: scale(isDesktop ? 20 : 30),
                },
              ]}
            />
            <View style={styles.opponentInfo}>
              <CustomText
                style={[
                  styles.opponentName,
                  { color: colors.text, fontSize: scale(isDesktop ? 14 : 18) },
                ]}
              >
                {request.sender?.username || "Bilinmeyen"}
              </CustomText>
              <CustomText
                style={[
                  styles.opponentLabel,
                  {
                    color: colors.text + "80",
                    fontSize: scale(isDesktop ? 11 : 14),
                  },
                ]}
              >
                sizi düelloya davet ediyor
              </CustomText>
            </View>
          </View>

          <View
            style={[
              styles.detailsContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.detailRow}>
              <Ionicons
                name="options"
                size={scale(isDesktop ? 16 : 20)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.detailText,
                  { color: colors.text, fontSize: scale(isDesktop ? 11 : 14) },
                ]}
              >
                {gameTypeText}
              </CustomText>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="swap-horizontal"
                size={scale(isDesktop ? 16 : 20)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.detailText,
                  { color: colors.text, fontSize: scale(isDesktop ? 11 : 14) },
                ]}
              >
                {directionText}
              </CustomText>
            </View>
            <View style={[styles.detailRow, { marginBottom: 0 }]}>
              <Ionicons
                name="star"
                size={scale(isDesktop ? 16 : 20)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.detailText,
                  { color: colors.text, fontSize: scale(isDesktop ? 11 : 14) },
                ]}
              >
                {request.difficulty && request.difficulty.length === 5
                  ? "Tüm Zorluklar"
                  : `Zorluk ${request.difficulty?.join(", ")}`}
              </CustomText>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Ionicons
              name="time-outline"
              size={scale(isDesktop ? 16 : 20)}
              color={timeLeft <= 10 ? "#F44336" : colors.primary}
            />
            <CustomText
              style={[
                styles.timeText,
                {
                  color: timeLeft <= 10 ? "#F44336" : colors.text,
                  fontSize: scale(isDesktop ? 14 : 16),
                  marginLeft: scale(4),
                },
              ]}
            >
              {formatTime(timeLeft)}
            </CustomText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.rejectButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  // DEĞİŞİKLİK: Masaüstü buton kalınlığı küçültüldü
                  paddingVertical: scale(isDesktop ? 8 : 12),
                  borderRadius: scale(24),
                },
              ]}
              onPress={handleReject}
              disabled={isProcessing}
            >
              <CustomText
                style={[
                  styles.buttonText,
                  { color: colors.text, fontSize: scale(isDesktop ? 12 : 16) },
                ]}
              >
                Reddet
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.acceptButton,
                {
                  backgroundColor: colors.primary,
                  paddingVertical: scale(isDesktop ? 8 : 12),
                  borderRadius: scale(24),
                },
              ]}
              onPress={handleAccept}
              disabled={isProcessing}
            >
              <CustomText
                style={[
                  styles.buttonText,
                  { color: "white", fontSize: scale(isDesktop ? 12 : 16) },
                ]}
              >
                {isProcessing ? "Kabul Ediliyor..." : "Kabul Et"}
              </CustomText>
            </TouchableOpacity>
          </View>
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
  modalContent: { width: "85%", maxWidth: 400 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontWeight: "600" },
  opponentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  opponentAvatar: { marginRight: 16 },
  opponentInfo: { flex: 1 },
  opponentName: { fontWeight: "600", marginBottom: 4 },
  opponentLabel: { fontWeight: "400" },
  detailsContainer: { padding: 16, borderRadius: 12, marginBottom: 20 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  detailText: { marginLeft: 12 },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  timeText: { fontWeight: "600" },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rejectButton: { borderWidth: 1 },
  acceptButton: { borderWidth: 0 },
  buttonText: { fontWeight: "600" },
});
