import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useHero } from "@contexts/HeroContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function HeroesScreen() {
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const {
    heroes,
    getHeroPieceCount,
    isHeroUnlocked,
    selectHeroForSlot,
    getSlotHero,
    userSlots,
  } = useHero();

  const [selectedHero, setSelectedHero] = useState<any>(null);
  const [slotModalVisible, setSlotModalVisible] = useState(false);

  const multipleChoiceSlotHero = getSlotHero("multiple-choice");
  const classicSlotHero = getSlotHero("classic");

  const handleHeroPress = (hero: any) => {
    setSelectedHero(hero);
    setSlotModalVisible(true);
  };

  const handleSelectSlot = async (slotType: "multiple-choice" | "classic") => {
    if (!selectedHero) return;

    const success = await selectHeroForSlot(selectedHero.name, slotType);
    if (success) {
      setSlotModalVisible(false);
      setSelectedHero(null);
    }
  };

  const getHeroImage = (heroName: string) => {
    switch (heroName) {
      case "Sihirbaz":
        return require("@assets/images/heroes/sihirbaz.png");
      case "Kahin":
        return require("@assets/images/heroes/kahin.png");
      case "Serap Ustası":
        return require("@assets/images/heroes/serap_ustasi.png");
      case "Zaman Bükücü":
        return require("@assets/images/heroes/zaman_bukucu.png");
      case "Samuray":
        return require("@assets/images/heroes/samuray.png");
      case "Zincirci":
        return require("@assets/images/heroes/zincirci.png");
      case "Havan Topçusu":
        return require("@assets/images/heroes/havan_topcusu.png");
      case "Büyücü":
        return require("@assets/images/heroes/buyucu.png");
      case "İnşaatçı":
        return require("@assets/images/heroes/insaatci.png");
      case "Vampir Lordu":
        return require("@assets/images/heroes/vampir_lordu.png");
      default:
        return require("@assets/images/heroes/default.png");
    }
  };

  const getHeroButtonText = (hero: any) => {
    const pieceCount = getHeroPieceCount(hero.name);
    if (!pieceCount || pieceCount === 0) return "Kilitli";
    if (pieceCount < 9) return `${pieceCount}/9`;
    return "Seç";
  };

  // selectedHero null kontrolü eklendi
  const isHeroSelectable = (
    hero: any,
    slotType: "multiple-choice" | "classic",
  ) => {
    if (!hero) return false;
    return hero.compatibleModes.includes(slotType) && isHeroUnlocked(hero.name);
  };

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: scale(50) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
          <CustomText
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: scale(20) },
            ]}
          >
            Kahramanlar
          </CustomText>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Slotlar */}
          <View style={styles.slotsContainer}>
            <View
              style={[
                styles.slotCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <CustomText style={[styles.slotTitle, { color: colors.text }]}>
                Çoktan Seçmeli Slotu
              </CustomText>
              {multipleChoiceSlotHero ? (
                <View style={styles.slotHero}>
                  <Image
                    source={getHeroImage(multipleChoiceSlotHero.name)}
                    style={[
                      styles.slotHeroImage,
                      {
                        width: scale(50),
                        height: scale(50),
                        borderRadius: scale(25),
                      },
                    ]}
                  />
                  <View style={styles.slotHeroInfo}>
                    <CustomText
                      style={[styles.slotHeroName, { color: colors.text }]}
                    >
                      {multipleChoiceSlotHero.displayName}
                    </CustomText>
                    <CustomText
                      style={[
                        styles.slotHeroAbility,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {multipleChoiceSlotHero.abilityName}
                    </CustomText>
                  </View>
                </View>
              ) : (
                <CustomText
                  style={[styles.slotEmpty, { color: colors.text + "60" }]}
                >
                  Kahraman seçilmedi
                </CustomText>
              )}
            </View>

            <View
              style={[
                styles.slotCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <CustomText style={[styles.slotTitle, { color: colors.text }]}>
                Klasik Slotu
              </CustomText>
              {classicSlotHero ? (
                <View style={styles.slotHero}>
                  <Image
                    source={getHeroImage(classicSlotHero.name)}
                    style={[
                      styles.slotHeroImage,
                      {
                        width: scale(50),
                        height: scale(50),
                        borderRadius: scale(25),
                      },
                    ]}
                  />
                  <View style={styles.slotHeroInfo}>
                    <CustomText
                      style={[styles.slotHeroName, { color: colors.text }]}
                    >
                      {classicSlotHero.displayName}
                    </CustomText>
                    <CustomText
                      style={[
                        styles.slotHeroAbility,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {classicSlotHero.abilityName}
                    </CustomText>
                  </View>
                </View>
              ) : (
                <CustomText
                  style={[styles.slotEmpty, { color: colors.text + "60" }]}
                >
                  Kahraman seçilmedi
                </CustomText>
              )}
            </View>
          </View>

          {/* Kahramanlar Grid */}
          <View style={styles.heroesGrid}>
            {heroes.map((hero, index) => {
              const pieceCount = getHeroPieceCount(hero.name);
              const isUnlocked = isHeroUnlocked(hero.name);
              const buttonText = getHeroButtonText(hero);

              return (
                <TouchableOpacity
                  key={hero.name}
                  style={[
                    styles.heroCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleHeroPress(hero)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={getHeroImage(hero.name)}
                    style={[
                      styles.heroImage,
                      {
                        width: scale(80),
                        height: scale(80),
                        borderRadius: scale(40),
                      },
                    ]}
                  />
                  <CustomText
                    style={[
                      styles.heroName,
                      { color: colors.text, fontSize: scale(14) },
                    ]}
                    numberOfLines={1}
                  >
                    {hero.displayName}
                  </CustomText>
                  <View
                    style={[
                      styles.heroButton,
                      {
                        backgroundColor: isUnlocked
                          ? colors.primary
                          : colors.card,
                        borderColor: colors.border,
                        marginTop: scale(8),
                      },
                    ]}
                  >
                    <CustomText
                      style={[
                        styles.heroButtonText,
                        {
                          color: isUnlocked ? "white" : colors.text + "60",
                          fontSize: scale(12),
                        },
                      ]}
                    >
                      {buttonText}
                    </CustomText>
                  </View>
                  {pieceCount > 0 && pieceCount < 9 && (
                    <View
                      style={[
                        styles.pieceProgress,
                        {
                          backgroundColor: colors.primary + "20",
                          marginTop: scale(4),
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.pieceProgressFill,
                          {
                            width: `${(pieceCount / 9) * 100}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Slot Seçim Modalı - selectedHero kontrolü eklendi */}
      <Modal
        visible={slotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSlotModalVisible(false);
          setSelectedHero(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <CustomText style={[styles.modalTitle, { color: colors.text }]}>
              {selectedHero?.displayName || "Kahraman"} Kahramanını Seç
            </CustomText>
            <CustomText
              style={[styles.modalMessage, { color: colors.text + "80" }]}
            >
              Bu kahramanı hangi slotta kullanmak istiyorsun?
            </CustomText>

            <TouchableOpacity
              style={[
                styles.slotOption,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity:
                    selectedHero &&
                    isHeroSelectable(selectedHero, "multiple-choice")
                      ? 1
                      : 0.5,
                },
              ]}
              onPress={() => handleSelectSlot("multiple-choice")}
              disabled={
                !selectedHero ||
                !isHeroSelectable(selectedHero, "multiple-choice")
              }
            >
              <Ionicons name="list" size={scale(24)} color={colors.primary} />
              <View style={styles.slotOptionInfo}>
                <CustomText
                  style={[styles.slotOptionTitle, { color: colors.text }]}
                >
                  Çoktan Seçmeli Slotu
                </CustomText>
                {selectedHero &&
                  !isHeroSelectable(selectedHero, "multiple-choice") && (
                    <CustomText
                      style={[styles.slotOptionWarning, { color: "#F44336" }]}
                    >
                      Bu kahraman çoktan seçmeli modda kullanılamaz
                    </CustomText>
                  )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.slotOption,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity:
                    selectedHero && isHeroSelectable(selectedHero, "classic")
                      ? 1
                      : 0.5,
                },
              ]}
              onPress={() => handleSelectSlot("classic")}
              disabled={
                !selectedHero || !isHeroSelectable(selectedHero, "classic")
              }
            >
              <Ionicons name="create" size={scale(24)} color={colors.primary} />
              <View style={styles.slotOptionInfo}>
                <CustomText
                  style={[styles.slotOptionTitle, { color: colors.text }]}
                >
                  Klasik Slotu
                </CustomText>
                {selectedHero && !isHeroSelectable(selectedHero, "classic") && (
                  <CustomText
                    style={[styles.slotOptionWarning, { color: "#F44336" }]}
                  >
                    Bu kahraman klasik modda kullanılamaz
                  </CustomText>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  marginTop: scale(16),
                  paddingVertical: scale(12),
                  borderRadius: scale(24),
                },
              ]}
              onPress={() => {
                setSlotModalVisible(false);
                setSelectedHero(null);
              }}
            >
              <CustomText
                style={[styles.cancelButtonText, { color: colors.text }]}
              >
                İptal
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  slotsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  slotCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  slotTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 12,
  },
  slotHero: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotHeroImage: {
    marginRight: 12,
  },
  slotHeroInfo: {
    flex: 1,
  },
  slotHeroName: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 2,
  },
  slotHeroAbility: {
    fontSize: 11,
  },
  slotEmpty: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 12,
  },
  heroesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCard: {
    width: "48%",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  heroImage: {
    marginBottom: 8,
  },
  heroName: {
    fontWeight: "600",
    textAlign: "center",
  },
  heroButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroButtonText: {
    fontWeight: "500",
  },
  pieceProgress: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  pieceProgressFill: {
    height: "100%",
  },
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
    fontSize: 20,
    marginBottom: 8,
  },
  modalMessage: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
  },
  slotOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
    marginBottom: 12,
    gap: 12,
  },
  slotOptionInfo: {
    flex: 1,
  },
  slotOptionTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  slotOptionWarning: {
    fontSize: 11,
    marginTop: 2,
  },
  cancelButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
});
