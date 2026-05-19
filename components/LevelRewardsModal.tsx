// components/LevelRewardsModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useDiamondReward } from "../contexts/DiamondRewardContext";
import { useGoldReward } from "../contexts/GoldRewardContext";
import { useLevel } from "../contexts/LevelContext";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";
import BottomSheetModal from "./BottomSheetModal";
import CustomText from "./CustomText";
import DiamondRewardModal from "./DiamondRewardModal";
import GoldRewardModal from "./GoldRewardModal";

interface LevelRewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LevelRewardsModal({
  visible,
  onClose,
}: LevelRewardsModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { levelInfo } = useLevel();
  const { refresh: refreshCurrency } = useCurrency();
  const goldReward = useGoldReward();
  const diamondReward = useDiamondReward();

  const [openedLevels, setOpenedLevels] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [showDiamondModal, setShowDiamondModal] = useState(false);
  const [goldCompleted, setGoldCompleted] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalLevel, setInfoModalLevel] = useState<number | null>(null);

  // Verilerin daha önce yüklenip yüklenmediğini takip etmek için ref
  const hasFetchedRef = useRef(false);

  const currentUserLevel = levelInfo?.level || 1;

  // Gösterilecek seviyeler: 2'den başlayarak mevcut seviyenin 2 seviye sonrasına kadar
  const maxDisplayLevel = currentUserLevel + 2;
  const levels = Array.from({ length: maxDisplayLevel - 1 }, (_, i) => i + 2);

  // 2 seviyeden sonrası için "..." gösterilecek mi?
  const hasMoreLevels = currentUserLevel + 2 < 100;

  // Sadece modal ilk kez görünür olduğunda veya user değiştiğinde verileri çek
  useEffect(() => {
    if (visible && user && !hasFetchedRef.current) {
      fetchOpenedChests();
      hasFetchedRef.current = true;
    }
  }, [visible, user]);

  // Eğer modal kapanırsa, bir sonraki açılışta tekrar çekmesi için ref'i sıfırla
  useEffect(() => {
    if (!visible) {
      hasFetchedRef.current = false;
    }
  }, [visible]);

  const fetchOpenedChests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("level_rewards_opened")
        .select("level")
        .eq("user_id", user.id);
      if (error) throw error;
      const openedSet = new Set<number>(data.map((item) => item.level));
      setOpenedLevels(openedSet);
    } catch (err) {
      console.error("Açılan sandıklar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChest = (level: number) => {
    setSelectedLevel(level);
    setGoldCompleted(false);
    setShowGoldModal(true);
  };

  const handleGoldComplete = () => {
    setShowGoldModal(false);
    setGoldCompleted(true);
    setShowDiamondModal(true);
  };

  const handleDiamondComplete = async () => {
    setShowDiamondModal(false);
    // Ödüller alındıktan sonra listeyi yenile
    await fetchOpenedChests();
    refreshCurrency();
    setSelectedLevel(null);
    setGoldCompleted(false);
  };

  const showInfoModal = (level: number) => {
    setInfoModalLevel(level);
    setInfoModalVisible(true);
  };

  const renderItem = ({ item: level }: { item: number }) => {
    const isOpened = openedLevels.has(level);
    const isUnlocked = level <= currentUserLevel;
    const isNextToOpen =
      !isOpened && isUnlocked && (level === 2 || openedLevels.has(level - 1));

    // Kilitli mi? (Ulaşılmış ama önceki seviye açılmamış)
    const isLocked = !isOpened && isUnlocked && !isNextToOpen;
    // Ulaşılamamış seviye
    const isUnreachable = !isUnlocked;

    return (
      <View style={[styles.levelItem, { borderBottomColor: colors.border }]}>
        {/* Sol Taraf: Seviye Bilgisi */}
        <View style={styles.levelInfo}>
          <CustomText style={[styles.levelNumber, { color: colors.text }]}>
            Seviye {level}
          </CustomText>
        </View>

        {/* Sağ Taraf: Durum / Buton */}
        <View style={styles.rightSection}>
          {isOpened ? (
            <View
              style={[
                styles.openedBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <CustomText
                style={[styles.openedText, { color: colors.primary }]}
              >
                Açıldı
              </CustomText>
            </View>
          ) : isNextToOpen ? (
            <TouchableOpacity
              style={[styles.openButton, { backgroundColor: colors.primary }]}
              onPress={() => handleOpenChest(level)}
              activeOpacity={0.7}
            >
              <CustomText style={[styles.openButtonText, { color: "white" }]}>
                Ödülü Aç
              </CustomText>
            </TouchableOpacity>
          ) : isLocked ? (
            <View style={styles.lockedButtonContainer}>
              <TouchableOpacity
                style={styles.infoIcon}
                onPress={() => showInfoModal(level)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.text + "60"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.lockedButton,
                  { backgroundColor: colors.text + "20" },
                ]}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <CustomText
                  style={[
                    styles.lockedButtonText,
                    { color: colors.text + "60" },
                  ]}
                >
                  Kilitli
                </CustomText>
              </TouchableOpacity>
            </View>
          ) : isUnreachable ? (
            <TouchableOpacity
              style={[
                styles.lockedButton,
                { backgroundColor: colors.text + "20" },
              ]}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <CustomText
                style={[styles.lockedButtonText, { color: colors.text + "60" }]}
              >
                Kilitli
              </CustomText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  // "..." gösterilecek placeholder
  const renderMoreLevels = () => {
    if (!hasMoreLevels) return null;
    return (
      <View style={[styles.levelItem, { borderBottomColor: colors.border }]}>
        <View style={styles.levelInfo}>
          <CustomText
            style={[styles.moreLevelsText, { color: colors.text + "60" }]}
          >
            ...
          </CustomText>
        </View>
        <View style={styles.rightSection}>
          <View
            style={[
              styles.lockedButton,
              { backgroundColor: colors.text + "10", opacity: 0.5 },
            ]}
          >
            <CustomText
              style={[styles.lockedButtonText, { color: colors.text + "40" }]}
            >
              Kilitli
            </CustomText>
          </View>
        </View>
      </View>
    );
  };

  // Info Modal (PostItem'daki gibi şikayet/iptal penceresi stili)
  const InfoModal = () => (
    <Modal
      visible={infoModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setInfoModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setInfoModalVisible(false)}
      >
        <View
          style={[
            styles.infoModalContainer,
            {
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              width: "80%",
              maxWidth: 300,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <View style={styles.infoModalHeader}>
            <Ionicons
              name="information-circle"
              size={28}
              color={colors.primary}
            />
            <CustomText
              style={[
                styles.infoModalTitle,
                { color: colors.text, marginLeft: 12 },
              ]}
            >
              Ödül Kilitli
            </CustomText>
          </View>

          <CustomText
            style={[styles.infoModalMessage, { color: colors.text + "CC" }]}
          >
            Bu seviyenin ödülünü açabilmek için önce Seviye{" "}
            {infoModalLevel && infoModalLevel - 1} ödülünü açmalısınız.
          </CustomText>

          <View style={styles.infoModalButtons}>
            <TouchableOpacity
              style={[
                styles.infoModalButton,
                { backgroundColor: colors.primary + "20" },
              ]}
              onPress={() => setInfoModalVisible(false)}
            >
              <CustomText
                style={[styles.infoModalButtonText, { color: colors.primary }]}
              >
                Tamam
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        title="Seviye Ödülleri"
        height="75%"
        showCloseButton={true}
        showDragHandle={true}
        closeOnBackdropPress={true}
        closeOnSwipeDown={true}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : levels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CustomText
              style={[styles.emptyText, { color: colors.text + "80" }]}
            >
              Henüz ulaşılmış seviye yok.
            </CustomText>
            <CustomText
              style={[styles.emptySubtext, { color: colors.text + "60" }]}
            >
              Oyun oynayarak seviye atla ve ödüllerini topla!
            </CustomText>
          </View>
        ) : (
          <FlatList
            data={levels}
            keyExtractor={(item) => item.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderMoreLevels}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </BottomSheetModal>

      {/* Altın Ödül Modalı */}
      {selectedLevel && (
        <GoldRewardModal
          visible={showGoldModal}
          onComplete={handleGoldComplete}
          level={selectedLevel}
        />
      )}

      {/* Elmas Ödül Modalı */}
      {selectedLevel && (
        <DiamondRewardModal
          visible={showDiamondModal}
          onComplete={handleDiamondComplete}
          level={selectedLevel}
          goldCompleted={goldCompleted}
        />
      )}

      <InfoModal />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  levelItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  levelInfo: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: "600",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  openedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  openedText: {
    fontSize: 13,
    fontWeight: "600",
  },
  openButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  lockedButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lockedButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  lockedButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoIcon: {
    padding: 4,
  },
  moreLevelsText: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
  },
  // Info Modal Stilleri (PostItem'daki gibi)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoModalContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  infoModalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  infoModalButtons: {
    flexDirection: "row",
    justifyContent: "center",
  },
  infoModalButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  infoModalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
