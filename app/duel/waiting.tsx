import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useDuel } from "@contexts/DuelContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function DuelWaitingScreen() {
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const { sentRequests, cancelInvite, activeSession } = useDuel();

  const [timeLeft, setTimeLeft] = useState(120);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  // Son gönderilen daveti bul ve süreyi hesapla
  useEffect(() => {
    if (sentRequests.length > 0) {
      const latest = sentRequests[0];
      if (latest.status === "pending") {
        setCurrentRequestId(latest.id);
        const expiresAt = new Date(latest.expires_at).getTime();
        const update = () => {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            // Süre doldu, otomatik iptal
            setShowCancelModal(true);
          }
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [sentRequests]);

  // Aktif oturum varsa hemen düello sayfasına yönlendir
  useEffect(() => {
    console.log(
      "🎮 Waiting screen - activeSession kontrolü:",
      activeSession?.id,
      activeSession?.status,
    );
    // DEĞİŞİKLİK: Sadece durumu finished veya abandoned OLMAYAN aktif bir oturum varsa yönlendir
    if (
      activeSession &&
      activeSession.status !== "finished" &&
      activeSession.status !== "abandoned"
    ) {
      console.log("✅ Aktif oturum bulundu, session sayfasına yönlendiriliyor");
      router.replace("/duel/session");
    }
  }, [activeSession]);

  // Her saniye activeSession'ı kontrol et (realtime gecikmelerine karşı)
  useEffect(() => {
    const interval = setInterval(() => {
      // DEĞİŞİKLİK: Sadece durumu finished veya abandoned OLMAYAN aktif bir oturum varsa yönlendir
      if (
        activeSession &&
        activeSession.status !== "finished" &&
        activeSession.status !== "abandoned"
      ) {
        router.replace("/duel/session");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleCancel = async () => {
    if (currentRequestId) {
      await cancelInvite(currentRequestId);
      setShowCancelModal(false);
      router.replace("/(tabs)");
    }
  };

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: scale(50) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowCancelModal(true)}
          >
            <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
          <CustomText
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: scale(20) },
            ]}
          >
            Rakip Bekleniyor
          </CustomText>
          <View style={{ width: scale(40) }} />
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <CustomText
              style={[
                styles.waitingText,
                {
                  color: colors.text,
                  fontSize: scale(18),
                  marginTop: scale(20),
                },
              ]}
            >
              Rakip aranıyor...
            </CustomText>
            <CustomText
              style={[
                styles.timeText,
                {
                  color: colors.text + "80",
                  fontSize: scale(16),
                  marginTop: scale(10),
                },
              ]}
            >
              {formatTime(timeLeft)}
            </CustomText>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.border, marginVertical: scale(20) },
              ]}
            />
            <CustomText
              style={[
                styles.infoText,
                {
                  color: colors.text + "80",
                  fontSize: scale(14),
                  textAlign: "center",
                },
              ]}
            >
              Davet gönderildi. Rakibinizin cevap vermesini bekliyoruz.
              {"\n\n"}
              Davet 120 saniye içinde kabul edilmezse otomatik olarak iptal
              olacaktır.
            </CustomText>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  marginTop: scale(30),
                  paddingVertical: scale(14),
                  borderRadius: scale(28),
                },
              ]}
              onPress={() => setShowCancelModal(true)}
            >
              <CustomText
                style={[
                  styles.cancelButtonText,
                  { color: colors.text, fontSize: scale(16) },
                ]}
              >
                İptal Et
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showCancelModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCancelModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.card }]}
            >
              <Ionicons name="warning" size={scale(50)} color="#FFA500" />
              <CustomText
                style={[
                  styles.modalTitle,
                  { color: colors.text, fontSize: scale(20) },
                ]}
              >
                Düelloyu İptal Et
              </CustomText>
              <CustomText
                style={[
                  styles.modalMessage,
                  { color: colors.text + "80", fontSize: scale(16) },
                ]}
              >
                {timeLeft === 0
                  ? "Davet süresi doldu. Ana sayfaya dönmek istiyor musunuz?"
                  : "Düello davetini iptal etmek istediğinizden emin misiniz?"}
              </CustomText>
              <View style={styles.modalButtons}>
                {timeLeft > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalCancelButton,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                    onPress={() => setShowCancelModal(false)}
                  >
                    <CustomText
                      style={[styles.modalButtonText, { color: colors.text }]}
                    >
                      Vazgeç
                    </CustomText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalConfirmButton,
                    {
                      backgroundColor: "#F44336",
                      flex: timeLeft > 0 ? 1 : undefined,
                    },
                  ]}
                  onPress={handleCancel}
                >
                  <CustomText
                    style={[styles.modalButtonText, { color: "white" }]}
                  >
                    {timeLeft === 0 ? "Ana Sayfaya Dön" : "İptal Et"}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontWeight: "600" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  waitingText: { fontWeight: "600" },
  timeText: { fontWeight: "500" },
  divider: { width: "100%", height: 1 },
  infoText: { lineHeight: 20 },
  cancelButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cancelButtonText: { fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitle: { fontWeight: "600", marginTop: 12, marginBottom: 8 },
  modalMessage: { textAlign: "center", marginBottom: 20 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: { borderWidth: 0 },
  modalConfirmButton: { borderWidth: 0 },
  modalButtonText: { fontSize: 16, fontWeight: "600" },
});
