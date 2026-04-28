import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useDuel } from "@contexts/DuelContext";
import { useFollow } from "@contexts/FollowContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { getAvatarSource } from "@utils/avatarUtils";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

// Kart tipleri ve bilgi metinleri (düello için özel)
const filterCards = [
  {
    id: "opponent",
    title: "Rakip",
    icon: "person" as const,
    info: "Takip ettiğiniz kullanıcılar arasından düello yapmak istediğiniz rakibi seçin.",
  },
  {
    id: "type",
    title: "Tür",
    icon: "options" as const,
    info: "Çoktan Seçmeli: 4 şıklı sorular.\nKlasik: Yazılı cevap.",
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
              // DEĞİŞİKLİK: Masaüstü için küçültüldü
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
              Düello Kuralları
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
                Davet süresi: 120 saniye
              </CustomText>
            </View>
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
                Oyun süresi: 120 saniye
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
                Pas Hakkı: 3
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
                Özel güç: Rakibin kulesinden bir parça yok et (60sn bekleme)
              </CustomText>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name="cube"
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
                Kuleyi ilk tamamlayan kazanır (5 parça)
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
          // DEĞİŞİKLİK: Masaüstünde buton dolgusu ve kavisleri küçültüldü
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

// Zorluk butonu için özel component
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
  return (
    <FilterButton
      label={label}
      selected={selected}
      onPress={onPress}
      icon={icon}
    />
  );
}

// Rakip kartı component'i
function OpponentCard({
  opponent,
  selected,
  onPress,
}: {
  opponent: any;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  return (
    <TouchableOpacity
      style={[
        styles.opponentCard,
        {
          backgroundColor: selected ? colors.primary + "20" : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          // DEĞİŞİKLİK: Masaüstü boyutlandırmaları eklendi
          padding: scale(isDesktop ? 6 : 12),
          borderRadius: scale(isDesktop ? 8 : 12),
          marginBottom: scale(isDesktop ? 4 : 8),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={getAvatarSource(opponent.avatar_index)}
        style={[
          styles.opponentAvatar,
          {
            width: scale(isDesktop ? 30 : 50),
            height: scale(isDesktop ? 30 : 50),
            borderRadius: scale(isDesktop ? 15 : 25),
            marginRight: scale(isDesktop ? 8 : 12),
          },
        ]}
      />
      <View style={styles.opponentInfo}>
        <CustomText
          style={[
            styles.opponentName,
            { color: colors.text, fontSize: scale(isDesktop ? 12 : 16) },
          ]}
        >
          {opponent.username}
        </CustomText>
        <CustomText
          style={[
            styles.opponentStats,
            { color: colors.text + "80", fontSize: scale(isDesktop ? 10 : 12) },
          ]}
        >
          {opponent.followers_count || 0} takipçi
        </CustomText>
      </View>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={scale(isDesktop ? 16 : 24)}
          color={colors.primary}
        />
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
              // DEĞİŞİKLİK: Masaüstü için boyutlar küçültüldü
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

export default function DuelFilterScreen() {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { filters, setFilters, sendInvite, isLoading } = useDuel();
  const { following } = useFollow();

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [gameInfoModalVisible, setGameInfoModalVisible] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState({ title: "", info: "" });
  const scrollX = useRef(new Animated.Value(0)).current;

  // DEĞİŞİKLİK: Kutular arası geçişte masaüstünde kullanılacak Fade Animasyonu
  const cardFadeAnim = useRef(new Animated.Value(1)).current;
  const cardWidth = isDesktop ? scale(260) : SCREEN_WIDTH;

  // Yerel state
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(
    filters.opponentId,
  );
  const [selectedType, setSelectedType] = useState<string | null>(
    filters.gameType || "multiple-choice",
  );
  const [selectedDirection, setSelectedDirection] = useState<string | null>(
    filters.direction || "old-to-new",
  );

  // Zorluk seçimi
  const [isDifficultyAll, setIsDifficultyAll] = useState(true);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>(
    [],
  );

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

  const handleSendInvite = async () => {
    if (!selectedOpponent || !selectedType || !selectedDirection) return;

    const difficultyArray = isDifficultyAll
      ? [1, 2, 3, 4, 5]
      : selectedDifficulties;

    const success = await sendInvite(selectedOpponent, {
      opponentId: selectedOpponent,
      gameType: selectedType as any,
      direction: selectedDirection as any,
      difficulty: difficultyArray,
    });

    if (success) {
      router.push("/duel/waiting");
    }
  };

  const isStartButtonActive =
    selectedOpponent && selectedType && selectedDirection;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveCardIndex(newIndex);
  };

  // DEĞİŞİKLİK: Masaüstünde yön okları için animasyonlu (Fade-In / Fade-Out) ileri fonksiyonu
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

  const handleInfoPress = (title: string, info: string) => {
    setSelectedInfo({ title, info });
    setInfoModalVisible(true);
  };

  const renderCardContent = (cardId: string) => {
    switch (cardId) {
      case "opponent":
        return (
          <View style={styles.cardContent}>
            {following && following.length > 0 ? (
              // DEĞİŞİKLİK: Masaüstünde çok fazla kişinin scrollu bozmaması için bir yüksekliğe sınırlandıralım
              <ScrollView
                style={
                  isDesktop
                    ? { maxHeight: scale(150), width: "100%" }
                    : { width: "100%" }
                }
                showsVerticalScrollIndicator={true}
              >
                {following.map((opponent) => (
                  <OpponentCard
                    key={opponent.id}
                    opponent={opponent}
                    selected={selectedOpponent === opponent.id}
                    onPress={() => setSelectedOpponent(opponent.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={scale(isDesktop ? 24 : 40)}
                  color={colors.text + "40"}
                />
                <CustomText
                  style={[
                    styles.emptyText,
                    {
                      color: colors.text + "80",
                      fontSize: scale(isDesktop ? 12 : 16),
                    },
                  ]}
                >
                  Takip ettiğiniz kullanıcı bulunmuyor
                </CustomText>
              </View>
            )}
          </View>
        );

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
              // DEĞİŞİKLİK: Masaüstünde üst barın boşlukları kısılarak yukarı çekildi
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
            Düello
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

        {/* DEĞİŞİKLİK: Masaüstünde içerikleri birbirine yaklaştırıp ortalamak için kapsayıcı */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            isDesktop
              ? {
                  flexGrow: 1,
                  justifyContent: "center",
                  paddingBottom: scale(20),
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
                        minHeight: scale(80), // DEĞİŞİKLİK: Masaüstü için minimum yükseklik azaltıldı
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
                  pagingEnabled
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
                        {/* Kart Başlığı */}
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

                        {/* Kart İçeriği */}
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
          <View
            style={[
              styles.paginationContainer,
              isDesktop && { marginTop: scale(75), marginBottom: scale(4) },
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

              const inputRange = [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
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

          {/* Davet Gönder Butonu */}
          <View
            style={[
              styles.buttonContainer,
              isDesktop && {
                alignItems: "center",
                marginTop: scale(10),
                marginBottom: 0,
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
              onPress={handleSendInvite}
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
                  Gönderiliyor...
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
                  DAVET GÖNDER
                </CustomText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

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
  headerTitle: { fontWeight: "600" },
  cardsSection: { flex: 1, marginTop: 20 },
  cardsScrollView: { flexGrow: 0 },
  cardsContent: { paddingVertical: 10 },
  cardContainer: { justifyContent: "center", alignItems: "center" },
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
  cardTitleContainer: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontWeight: "600" },
  cardBody: { minHeight: 300, justifyContent: "center" },
  cardContent: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  filterButton: {
    borderWidth: 1,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  filterButtonText: { fontWeight: "500" },
  starContainer: { flexDirection: "row", alignItems: "center", gap: 2 },
  opponentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  opponentAvatar: {},
  opponentInfo: { flex: 1 },
  opponentName: { fontWeight: "600", marginBottom: 2 },
  opponentStats: { fontWeight: "400" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: { textAlign: "center", marginTop: 12 },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  paginationDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  buttonContainer: { paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
  startButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  startButtonText: { fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoModal: { width: "80%", maxWidth: 400 },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  infoModalTitle: { fontWeight: "600", flex: 1 },
  infoModalText: { textAlign: "left" },
  infoSection: { marginTop: 8 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoText: { flex: 1 },
});
