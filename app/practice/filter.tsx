import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { usePractice } from "@contexts/PracticeContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Ünite verileri
const unitData = [
  { unit_number: 1, unit_name: "Giriş Kapısı" },
  { unit_number: 2, unit_name: "Okul Bahçesi" },
  { unit_number: 3, unit_name: "Psikoloji Kulübü" },
  { unit_number: 4, unit_name: "Uzay İstasyonu" },
  { unit_number: 5, unit_name: "Gençliğe Hitabe" },
  { unit_number: 6, unit_name: "Matematik Köyü" },
  { unit_number: 7, unit_name: "Adalet Sarayı" },
];

// Köken seçenekleri
const originOptions = [
  { id: "all", label: "Tümü", value: null },
  { id: "turkish", label: "Türkçe", value: "Turkish" },
  { id: "arabic", label: "Arapça", value: "Arabic" },
  { id: "french", label: "Fransızca", value: "French" },
  { id: "persian", label: "Farsça", value: "Persian" },
];

// Ünite seçenekleri - isimlerle birlikte
const unitOptions = [
  { id: "all", label: "Tümü", value: null },
  ...unitData.map((unit) => ({
    id: unit.unit_number,
    label: `${unit.unit_number} - ${unit.unit_name}`,
    value: unit.unit_number,
  })),
];

// Zorluk seçenekleri
const difficultyOptions = [
  { id: "all", label: "Tümü", value: null },
  { id: 1, label: "1", value: 1 },
  { id: 2, label: "2", value: 2 },
  { id: 3, label: "3", value: 3 },
  { id: 4, label: "4", value: 4 },
  { id: 5, label: "5", value: 5 },
];

// Yön seçenekleri
const directionOptions = [
  { id: "old-to-new", label: "Eski → Yeni", value: "old-to-new" },
  { id: "new-to-old", label: "Yeni → Eski", value: "new-to-old" },
];

// Tür seçenekleri
const typeOptions = [
  { id: "multiple-choice", label: "Çoktan Seçmeli", value: "multiple-choice" },
  { id: "classic", label: "Klasik", value: "classic" },
];

// Kart tipleri ve bilgi metinleri
const filterCards = [
  {
    id: "type",
    title: "Tür",
    icon: "options" as const,
    info: 'Çoktan Seçmeli: 4 şıklı sorular. Her doğru cevap kelime zorluğu ×1 puan.\nKlasik: Yazılı cevap. Her doğru cevap kelime zorluğu ×2 puan.\n\nKlasik modda cevap alanına "pas" yazıp kontrol et butonuna basarak pas hakkı kullanabilirsiniz.',
  },
  {
    id: "direction",
    title: "Yön",
    icon: "swap-horizontal" as const,
    info: "Eski → Yeni: Eski Türkçe kelimenin yeni Türkçe karşılığını bulun.\nYeni → Eski: Yeni Türkçe kelimenin eski Türkçe karşılığını bulun.",
  },
  {
    id: "difficulty",
    title: "Zorluk",
    icon: "star" as const,
    info: "Kelime zorluğu puan çarpanını belirler. Zor kelimeler daha çok puan kazandırır.",
  },
  {
    id: "origin",
    title: "Köken",
    icon: "globe" as const,
    info: "Kelimenin kökenine göre filtreleme yapın. İstediğiniz kökenleri seçebilirsiniz.",
  },
  {
    id: "unit",
    title: "Ünite",
    icon: "layers" as const,
    info: "Belirli ünitelerden kelime seçmek için kullanın. Birden fazla ünite seçebilirsiniz.",
  },
];

// Bilgi Modalı (oyun kuralları için)
function GameInfoModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.infoModal,
            {
              backgroundColor: colors.card,
              borderRadius: scale(isDesktop ? 8 : 20),
              padding: scale(isDesktop ? 12 : 20),
              maxWidth: isDesktop ? scale(200) : 400,
            },
          ]}
        >
          <View
            style={[
              styles.infoModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <CustomText
              style={[
                styles.infoModalTitle,
                { color: colors.text, fontSize: scale(isDesktop ? 13 : 18) },
              ]}
            >
              Oyun Kuralları
            </CustomText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={scale(isDesktop ? 16 : 24)}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <View
              style={[
                styles.infoRow,
                { marginBottom: scale(isDesktop ? 4 : 12) },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={scale(isDesktop ? 14 : 20)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.infoText,
                  {
                    color: colors.text,
                    fontSize: scale(isDesktop ? 11 : 14),
                    marginLeft: scale(6),
                  },
                ]}
              >
                Süre: 60 saniye
              </CustomText>
            </View>

            <View
              style={[
                styles.infoRow,
                { marginBottom: scale(isDesktop ? 4 : 12) },
              ]}
            >
              <Ionicons
                name="repeat"
                size={scale(isDesktop ? 14 : 20)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.infoText,
                  {
                    color: colors.text,
                    fontSize: scale(isDesktop ? 11 : 14),
                    marginLeft: scale(6),
                  },
                ]}
              >
                Pas Hakkı: 3 (her alıştırmada)
              </CustomText>
            </View>

            <View
              style={[
                styles.infoRow,
                { marginBottom: scale(isDesktop ? 4 : 12) },
              ]}
            >
              <Ionicons
                name="flame"
                size={scale(isDesktop ? 14 : 20)}
                color="#FFA500"
              />
              <CustomText
                style={[
                  styles.infoText,
                  {
                    color: colors.text,
                    fontSize: scale(isDesktop ? 11 : 14),
                    marginLeft: scale(6),
                  },
                ]}
              >
                5 doğru cevapta kombo modu açılır ve puanlar 2 katı kazanılır
              </CustomText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface FilterButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}

function FilterButton({ label, selected, onPress, icon }: FilterButtonProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: selected ? colors.primary : colors.background,
          borderColor: selected ? colors.primary : colors.border,
          paddingVertical: scale(isDesktop ? 4 : 10),
          paddingHorizontal: scale(isDesktop ? 8 : 16),
          borderRadius: scale(isDesktop ? 6 : 20),
          minWidth: scale(isDesktop ? 30 : 60),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon ? (
        icon
      ) : (
        <CustomText
          style={[
            styles.filterButtonText,
            {
              color: selected ? "white" : colors.text,
              fontSize: scale(isDesktop ? 10 : 14),
            },
          ]}
        >
          {label}
        </CustomText>
      )}
    </TouchableOpacity>
  );
}

function DifficultyButton({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: selected ? colors.primary : colors.background,
          borderColor: selected ? colors.primary : colors.border,
          paddingVertical: scale(isDesktop ? 4 : 10),
          paddingHorizontal: scale(isDesktop ? 8 : 16),
          borderRadius: scale(isDesktop ? 6 : 20),
          minWidth: scale(isDesktop ? 30 : 60),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon ? (
        icon
      ) : (
        <CustomText
          style={[
            styles.filterButtonText,
            {
              color: selected ? "white" : colors.text,
              fontSize: scale(isDesktop ? 10 : 14),
            },
          ]}
        >
          {label}
        </CustomText>
      )}
    </TouchableOpacity>
  );
}

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  info: string;
}

function InfoModal({ visible, onClose, title, info }: InfoModalProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.infoModal,
            {
              backgroundColor: colors.card,
              borderRadius: scale(isDesktop ? 8 : 20),
              padding: scale(isDesktop ? 12 : 20),
              maxWidth: isDesktop ? scale(200) : 400,
            },
          ]}
        >
          <View
            style={[
              styles.infoModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <CustomText
              style={[
                styles.infoModalTitle,
                { color: colors.text, fontSize: scale(isDesktop ? 13 : 18) },
              ]}
            >
              {title}
            </CustomText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={scale(isDesktop ? 16 : 24)}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <CustomText
            style={[
              styles.infoModalText,
              {
                color: colors.text + "CC",
                fontSize: scale(isDesktop ? 11 : 14),
                lineHeight: scale(isDesktop ? 14 : 20),
              },
            ]}
          >
            {info}
          </CustomText>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function PracticeFilterScreen() {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { filters, setFilters, startPractice, isLoading } = usePractice();

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [gameInfoModalVisible, setGameInfoModalVisible] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState({ title: "", info: "" });
  const scrollX = useRef(new Animated.Value(0)).current;

  const cardFadeAnim = useRef(new Animated.Value(1)).current;

  const cardWidth = isDesktop ? scale(320) : SCREEN_WIDTH;

  const [selectedType, setSelectedType] = useState<string | null>(
    filters.type || "multiple-choice",
  );
  const [selectedDirection, setSelectedDirection] = useState<string | null>(
    filters.direction || "old-to-new",
  );

  const [isDifficultyAll, setIsDifficultyAll] = useState(true);
  const [isOriginAll, setIsOriginAll] = useState(true);
  const [isUnitAll, setIsUnitAll] = useState(true);

  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>(
    [],
  );
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);

  const toggleDifficulty = (value: number | null) => {
    if (value === null) {
      setIsDifficultyAll(true);
      setSelectedDifficulties([]);
    } else {
      if (isDifficultyAll) {
        setIsDifficultyAll(false);
        setSelectedDifficulties([value]);
      } else {
        if (selectedDifficulties.includes(value)) {
          const newSelected = selectedDifficulties.filter((v) => v !== value);
          if (newSelected.length === 0) {
            setIsDifficultyAll(true);
            setSelectedDifficulties([]);
          } else {
            setSelectedDifficulties(newSelected);
          }
        } else {
          setSelectedDifficulties([...selectedDifficulties, value]);
        }
      }
    }
  };

  const toggleOrigin = (value: string | null) => {
    if (value === null) {
      setIsOriginAll(true);
      setSelectedOrigins([]);
    } else {
      if (isOriginAll) {
        setIsOriginAll(false);
        setSelectedOrigins([value]);
      } else {
        if (selectedOrigins.includes(value)) {
          const newSelected = selectedOrigins.filter((v) => v !== value);
          if (newSelected.length === 0) {
            setIsOriginAll(true);
            setSelectedOrigins([]);
          } else {
            setSelectedOrigins(newSelected);
          }
        } else {
          setSelectedOrigins([...selectedOrigins, value]);
        }
      }
    }
  };

  const toggleUnit = (value: number | null) => {
    if (value === null) {
      setIsUnitAll(true);
      setSelectedUnits([]);
    } else {
      if (isUnitAll) {
        setIsUnitAll(false);
        setSelectedUnits([value]);
      } else {
        if (selectedUnits.includes(value)) {
          const newSelected = selectedUnits.filter((v) => v !== value);
          if (newSelected.length === 0) {
            setIsUnitAll(true);
            setSelectedUnits([]);
          } else {
            setSelectedUnits(newSelected);
          }
        } else {
          setSelectedUnits([...selectedUnits, value]);
        }
      }
    }
  };

  const handleStartPractice = async () => {
    let difficultyArray = isDifficultyAll
      ? [1, 2, 3, 4, 5]
      : selectedDifficulties;

    let originArray = isOriginAll
      ? ["Turkish", "Arabic", "French", "Persian"]
      : selectedOrigins;

    let unitArray = isUnitAll ? [1, 2, 3, 4, 5, 6, 7] : selectedUnits;

    setFilters({
      type: selectedType as any,
      direction: selectedDirection as any,
      difficulty: difficultyArray,
      origin: originArray,
      unit: unitArray,
    });

    const sessionId = await startPractice({
      type: selectedType as any,
      direction: selectedDirection as any,
      difficulty: difficultyArray,
      origin: originArray,
      unit: unitArray,
    });

    if (sessionId) {
      router.push("/practice/session");
    }
  };

  const handleInfoPress = (title: string, info: string) => {
    setSelectedInfo({ title, info });
    setInfoModalVisible(true);
  };

  const isStartButtonActive = selectedType && selectedDirection;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveCardIndex(newIndex);
  };

  const handleNextCard = () => {
    if (activeCardIndex < filterCards.length - 1) {
      if (isDesktop) {
        Animated.timing(cardFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setActiveCardIndex(activeCardIndex + 1);
          Animated.timing(cardFadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      } else {
        scrollViewRef.current?.scrollTo({
          x: (activeCardIndex + 1) * cardWidth,
          animated: true,
        });
        setActiveCardIndex(activeCardIndex + 1);
      }
    }
  };

  const handlePrevCard = () => {
    if (activeCardIndex > 0) {
      if (isDesktop) {
        Animated.timing(cardFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setActiveCardIndex(activeCardIndex - 1);
          Animated.timing(cardFadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      } else {
        scrollViewRef.current?.scrollTo({
          x: (activeCardIndex - 1) * cardWidth,
          animated: true,
        });
        setActiveCardIndex(activeCardIndex - 1);
      }
    }
  };

  const renderCardContent = (cardId: string) => {
    switch (cardId) {
      case "type":
        return (
          <View style={styles.cardContent}>
            {typeOptions.map((option) => (
              <FilterButton
                key={option.id}
                label={option.label}
                selected={selectedType === option.value}
                onPress={() => setSelectedType(option.value as any)}
              />
            ))}
          </View>
        );

      case "direction":
        return (
          <View style={styles.cardContent}>
            {directionOptions.map((option) => (
              <FilterButton
                key={option.id}
                label={option.label}
                selected={selectedDirection === option.value}
                onPress={() => setSelectedDirection(option.value as any)}
              />
            ))}
          </View>
        );

      case "difficulty":
        return (
          <View style={styles.cardContent}>
            {difficultyOptions.map((option) => (
              <DifficultyButton
                key={option.id}
                label={option.label}
                selected={
                  option.value === null
                    ? isDifficultyAll
                    : !isDifficultyAll &&
                      selectedDifficulties.includes(option.value)
                }
                onPress={() => toggleDifficulty(option.value)}
                icon={
                  option.value !== null ? (
                    <View style={styles.starContainer}>
                      {Array.from({ length: option.value }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={scale(isDesktop ? 10 : 16)}
                          color={
                            !isDifficultyAll &&
                            selectedDifficulties.includes(option.value)
                              ? "white"
                              : "#FFD700"
                          }
                        />
                      ))}
                    </View>
                  ) : undefined
                }
              />
            ))}
          </View>
        );

      case "origin":
        return (
          <View style={styles.cardContent}>
            {originOptions.map((option) => (
              <FilterButton
                key={option.id}
                label={option.label}
                selected={
                  option.value === null
                    ? isOriginAll
                    : !isOriginAll && selectedOrigins.includes(option.value)
                }
                onPress={() => toggleOrigin(option.value)}
              />
            ))}
          </View>
        );

      case "unit":
        return (
          <View style={styles.cardContent}>
            {unitOptions.map((option) => (
              <FilterButton
                key={option.id}
                label={option.label}
                selected={
                  option.value === null
                    ? isUnitAll
                    : !isUnitAll && selectedUnits.includes(option.value)
                }
                onPress={() => toggleUnit(option.value)}
              />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: scale(isDesktop ? 10 : 50),
              paddingBottom: scale(isDesktop ? 10 : 20),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={scale(isDesktop ? 16 : 24)}
              color={colors.text}
            />
          </TouchableOpacity>

          <CustomText
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: scale(isDesktop ? 14 : 20) },
            ]}
          >
            Alıştırma
          </CustomText>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setGameInfoModalVisible(true)}
          >
            <Ionicons
              name="help-circle-outline"
              size={scale(isDesktop ? 18 : 24)}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            isDesktop
              ? {
                  flexGrow: 1,
                  justifyContent: "center",
                  paddingBottom: scale(0),
                }
              : { flexGrow: 1 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Yatay Kaydırmalı VEYA Fade Geçişli Kartlar */}
          <View
            style={[
              styles.cardsSection,
              isDesktop && {
                flex: 0,
                marginTop: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            {/* Sol Ok (Sadece Masaüstü) */}
            {isDesktop && (
              <TouchableOpacity
                onPress={handlePrevCard}
                style={{
                  padding: scale(8),
                  opacity: activeCardIndex === 0 ? 0.2 : 1,
                }}
                disabled={activeCardIndex === 0}
              >
                <Ionicons
                  name="chevron-back"
                  size={scale(20)}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}

            {isDesktop ? (
              <Animated.View
                style={{
                  opacity: cardFadeAnim,
                  width: cardWidth,
                  marginHorizontal: scale(16),
                }}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: scale(8),
                      marginHorizontal: 0,
                      width: "100%",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.cardHeader,
                      {
                        borderBottomColor: colors.border,
                        padding: scale(8),
                      },
                    ]}
                  >
                    <View style={styles.cardTitleContainer}>
                      <Ionicons
                        name={filterCards[activeCardIndex].icon}
                        size={scale(14)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={[
                          styles.cardTitle,
                          {
                            color: colors.text,
                            fontSize: scale(13),
                            marginLeft: scale(6),
                          },
                        ]}
                      >
                        {filterCards[activeCardIndex].title}
                      </CustomText>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleInfoPress(
                          filterCards[activeCardIndex].title,
                          filterCards[activeCardIndex].info,
                        )
                      }
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={scale(16)}
                        color={colors.text + "80"}
                      />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.cardBody,
                      {
                        padding: scale(8),
                        minHeight: scale(80),
                      },
                    ]}
                  >
                    {renderCardContent(filterCards[activeCardIndex].id)}
                  </View>
                </View>
              </Animated.View>
            ) : (
              <View style={{ flex: 1 }}>
                <Animated.ScrollView
                  ref={scrollViewRef}
                  horizontal
                  pagingEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  onMomentumScrollEnd={handleMomentumScrollEnd}
                  scrollEventThrottle={16}
                  style={styles.cardsScrollView}
                  contentContainerStyle={styles.cardsContent}
                >
                  {filterCards.map((card) => (
                    <View
                      key={card.id}
                      style={[styles.cardContainer, { width: cardWidth }]}
                    >
                      <View
                        style={[
                          styles.card,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: scale(20),
                            marginHorizontal: scale(20),
                            width: SCREEN_WIDTH - 40,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.cardHeader,
                            {
                              borderBottomColor: colors.border,
                              padding: scale(16),
                            },
                          ]}
                        >
                          <View style={styles.cardTitleContainer}>
                            <Ionicons
                              name={card.icon}
                              size={scale(24)}
                              color={colors.primary}
                            />
                            <CustomText
                              style={[
                                styles.cardTitle,
                                {
                                  color: colors.text,
                                  fontSize: scale(18),
                                  marginLeft: scale(8),
                                },
                              ]}
                            >
                              {card.title}
                            </CustomText>
                          </View>
                          <TouchableOpacity
                            onPress={() =>
                              handleInfoPress(card.title, card.info)
                            }
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            <Ionicons
                              name="information-circle-outline"
                              size={scale(24)}
                              color={colors.text + "80"}
                            />
                          </TouchableOpacity>
                        </View>

                        <View
                          style={[
                            styles.cardBody,
                            { padding: scale(16), minHeight: scale(200) },
                          ]}
                        >
                          {renderCardContent(card.id)}
                        </View>
                      </View>
                    </View>
                  ))}
                </Animated.ScrollView>
              </View>
            )}

            {/* Sağ Ok (Sadece Masaüstü) */}
            {isDesktop && (
              <TouchableOpacity
                onPress={handleNextCard}
                style={{
                  padding: scale(8),
                  opacity: activeCardIndex === filterCards.length - 1 ? 0.2 : 1,
                }}
                disabled={activeCardIndex === filterCards.length - 1}
              >
                <Ionicons
                  name="chevron-forward"
                  size={scale(20)}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Sayfa İndikatörü */}
          {/* DEĞİŞİKLİK: Başla butonu ve noktaları biraz daha aşağı taşımak için üst boşluk artırıldı */}
          <View
            style={[
              styles.paginationContainer,
              isDesktop && { marginTop: scale(75), marginBottom: scale(12) },
            ]}
          >
            {filterCards.map((_, index) => {
              if (isDesktop) {
                const isActive = activeCardIndex === index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: colors.primary,
                        width: isActive ? 16 : 8,
                        opacity: isActive ? 1 : 0.3,
                        height: 6,
                        borderRadius: 4,
                        marginHorizontal: 4,
                      },
                    ]}
                  />
                );
              }

              // Mobil için scroll animasyonlu noktalar
              const inputRange = [
                (index - 1) * cardWidth,
                index * cardWidth,
                (index + 1) * cardWidth,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 16, 8],
                extrapolate: "clamp",
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: colors.primary,
                      width: dotWidth,
                      opacity,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 4,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Başla Butonu */}
          {/* DEĞİŞİKLİK: Başla butonu biraz daha aşağı taşındı */}
          <View
            style={[
              styles.buttonContainer,
              isDesktop && {
                alignItems: "center",
                marginTop: scale(5),
                marginBottom: scale(20),
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.startButton,
                {
                  backgroundColor: isStartButtonActive
                    ? colors.primary
                    : colors.card,
                  borderColor: colors.border,
                  opacity: isStartButtonActive ? 1 : 0.5,
                  paddingVertical: scale(isDesktop ? 8 : 16),
                  borderRadius: scale(isDesktop ? 8 : 30),
                },
                isDesktop && { width: scale(160) },
              ]}
              onPress={handleStartPractice}
              disabled={!isStartButtonActive || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <CustomText
                  style={[
                    styles.startButtonText,
                    {
                      color: isStartButtonActive ? "white" : colors.text + "80",
                      fontSize: scale(isDesktop ? 12 : 18),
                    },
                  ]}
                >
                  Başlatılıyor...
                </CustomText>
              ) : (
                <CustomText
                  style={[
                    styles.startButtonText,
                    {
                      color: isStartButtonActive ? "white" : colors.text + "80",
                      fontSize: scale(isDesktop ? 12 : 18),
                    },
                  ]}
                >
                  BAŞLA
                </CustomText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Kart Info Modal */}
        <InfoModal
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
          title={selectedInfo.title}
          info={selectedInfo.info}
        />

        {/* Oyun Kuralları Modalı */}
        <GameInfoModal
          visible={gameInfoModalVisible}
          onClose={() => setGameInfoModalVisible(false)}
        />
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "600",
  },
  cardsSection: {
    flex: 1,
    marginTop: 20,
  },
  cardsScrollView: {
    flexGrow: 0,
  },
  cardsContent: {
    paddingVertical: 10,
  },
  cardContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: SCREEN_WIDTH - 40,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontWeight: "600",
  },
  cardBody: {
    minHeight: 200,
    justifyContent: "center",
  },
  cardContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonText: {
    fontWeight: "500",
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  startButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  startButtonText: {
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoModal: {
    width: "80%",
    maxWidth: 400,
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  infoModalTitle: {
    fontWeight: "600",
    flex: 1,
  },
  infoModalText: {
    textAlign: "left",
  },
  infoSection: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
  },
});
