// app/(tabs)/index.tsx
import ArenaListModal from "@components/Arena/ArenaListModal";
import AuthRequiredModal from "@components/AuthRequiredModal";
import BackgroundImage from "@components/BackgroundImage";
import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import DataNotSavedWarningModal from "@components/DataNotSavedWarningModal";
import HomeInfoBoxes from "@components/Home/HomeInfoBoxes";
import HomeProgress from "@components/Home/HomeProgress";
import HomeTopBar from "@components/Home/HomeTopBar";
import PullToRefreshScroll from "@components/PullToRefreshScroll";
import { useArena } from "@contexts/ArenaContext";
import { useAuth } from "@contexts/AuthContext";
import { useDuel } from "@contexts/DuelContext";
import { useEducation } from "@contexts/EducationContext";
import { GameMode, useGameMode } from "@contexts/GameModeContext";
import { useLevel } from "@contexts/LevelContext";
import { usePractice } from "@contexts/PracticeContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { colors, themeMode } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { user } = useAuth();
  const { gameMode, setGameMode } = useGameMode();
  const { statistics } = usePractice();
  const { userStats, fetchUserStats } = useDuel();
  const { progress, loadProgress } = useEducation();
  const { refreshLevel } = useLevel();
  const { currentArena, userProgress, arenas, refreshArenaData } = useArena();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [arenaModalVisible, setArenaModalVisible] = useState(false);

  // Misafir kullanıcı için uyarı modalları
  const [authRequiredModalVisible, setAuthRequiredModalVisible] =
    useState(false);
  const [dataWarningModalVisible, setDataWarningModalVisible] = useState(false);

  // Temaya göre görsel seçimi
  const getPracticeBackground = () => {
    if (themeMode === "dark") {
      return require("@assets/images/practice/practice-bg-dark.png");
    } else {
      return require("@assets/images/practice/practice-bg-light.png");
    }
  };

  // Düello görseli - Arena görseli
  const getDuelBackground = () => {
    if (!currentArena) {
      return themeMode === "dark"
        ? require("@assets/images/arena/arena1-dark.png")
        : require("@assets/images/arena/arena1-light.png");
    }

    if (themeMode === "dark") {
      switch (currentArena.arena_number) {
        case 1:
          return require("@assets/images/arena/arena1-dark.png");
        case 2:
          return require("@assets/images/arena/arena2-dark.png");
        case 3:
          return require("@assets/images/arena/arena3-dark.png");
        case 4:
          return require("@assets/images/arena/arena4-dark.png");
        case 5:
          return require("@assets/images/arena/arena5-dark.png");
        case 6:
          return require("@assets/images/arena/arena6-dark.png");
        case 7:
          return require("@assets/images/arena/arena7-dark.png");
        case 8:
          return require("@assets/images/arena/arena8-dark.png");
        case 9:
          return require("@assets/images/arena/arena9-dark.png");
        case 10:
          return require("@assets/images/arena/arena10-dark.png");
        default:
          return require("@assets/images/arena/arena1-dark.png");
      }
    } else {
      switch (currentArena.arena_number) {
        case 1:
          return require("@assets/images/arena/arena1-light.png");
        case 2:
          return require("@assets/images/arena/arena2-light.png");
        case 3:
          return require("@assets/images/arena/arena3-light.png");
        case 4:
          return require("@assets/images/arena/arena4-light.png");
        case 5:
          return require("@assets/images/arena/arena5-light.png");
        case 6:
          return require("@assets/images/arena/arena6-light.png");
        case 7:
          return require("@assets/images/arena/arena7-light.png");
        case 8:
          return require("@assets/images/arena/arena8-light.png");
        case 9:
          return require("@assets/images/arena/arena9-light.png");
        case 10:
          return require("@assets/images/arena/arena10-light.png");
        default:
          return require("@assets/images/arena/arena1-light.png");
      }
    }
  };

  // Eğitim ilerlemesini yükle
  useEffect(() => {
    if (user) {
      loadProgress();
      fetchUserStats();
      refreshArenaData();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 2000)),
        user ? loadProgress() : Promise.resolve(),
        user ? fetchUserStats() : Promise.resolve(),
        user ? refreshLevel() : Promise.resolve(),
        user ? refreshArenaData() : Promise.resolve(),
      ]);
      if (Platform.OS !== "web") {
        Alert.alert("✅ Sayfa Yenilendi", "Ana sayfa bilgileri güncellendi.", [
          { text: "Tamam" },
        ]);
      }
    } catch (error) {
      console.error("Sayfa yenilenirken hata:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGameModeSelect = async (mode: GameMode) => {
    await setGameMode(mode);
    setModalVisible(false);
  };

  const handleStartPress = () => {
    switch (gameMode) {
      case "education":
        if (!user) {
          setAuthRequiredModalVisible(true);
          return;
        }

        if (progress) {
          const step = progress.current_step;
          if (step === 1) {
            router.push({
              pathname: "/education/step1",
              params: {
                unitId: progress.current_unit,
                stageId: progress.current_stage,
              },
            });
          } else if (step === 2) {
            router.push({
              pathname: "/education/step2",
              params: {
                unitId: progress.current_unit,
                stageId: progress.current_stage,
              },
            });
          } else if (step === 3) {
            router.push({
              pathname: "/education/step3",
              params: {
                unitId: progress.current_unit,
                stageId: progress.current_stage,
              },
            });
          }
        } else {
          router.push({
            pathname: "/education/step1",
            params: { unitId: 1, stageId: 1 },
          });
        }
        break;

      case "practice":
        if (!user) {
          setDataWarningModalVisible(true);
          return;
        }
        router.push("/practice/filter");
        break;

      case "duel":
        if (!user) {
          setAuthRequiredModalVisible(true);
          return;
        }
        router.push("/duel/filter");
        break;
    }
  };

  const handlePracticeContinueWithoutLogin = () => {
    router.push("/practice/filter");
  };

  const handleUnitChange = (newUnit: number) => {
    console.log("Yeni ünite seçildi:", newUnit);
    router.push({
      pathname: "/education/step1",
      params: { unitId: newUnit, stageId: 1 },
    });
  };

  const getModeContent = () => {
    switch (gameMode) {
      case "education":
        return {
          content:
            progress && user ? (
              <HomeProgress
                unitNumber={progress.current_unit}
                stageNumber={progress.current_stage}
                step={progress.current_step}
                onUnitChange={handleUnitChange}
              />
            ) : (
              <HomeProgress
                unitNumber={1}
                stageNumber={1}
                step={1}
                onUnitChange={handleUnitChange}
              />
            ),
        };

      case "practice":
        return {
          content: (
            <View
              style={[
                styles.modeContainer,
                isDesktop && { width: "75%", alignSelf: "center" },
              ]}
            >
              <Image
                source={getPracticeBackground()}
                style={[
                  styles.modeImage,
                  {
                    width: "100%",
                    height: scale(isDesktop ? 140 : 200),
                    borderTopLeftRadius: scale(16),
                    borderTopRightRadius: scale(16),
                  },
                ]}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.practiceInfoCard,
                  {
                    backgroundColor: colors.card,
                    borderBottomLeftRadius: scale(16),
                    borderBottomRightRadius: scale(16),
                    padding: isDesktop ? scale(12) : 20,
                  },
                ]}
              >
                <View style={styles.practiceScoreContainer}>
                  <Ionicons
                    name="trophy"
                    size={scale(isDesktop ? 26 : 40)}
                    color="#FFD700"
                  />
                  <CustomText
                    style={[
                      styles.practiceScore,
                      {
                        color: colors.text,
                        fontSize: scale(isDesktop ? 22 : 32),
                      },
                    ]}
                  >
                    {user
                      ? statistics?.total_practice_score?.toLocaleString() ||
                        "0"
                      : "0"}
                  </CustomText>
                </View>
                <View style={styles.practiceTextContainer}>
                  <CustomText
                    style={[
                      styles.practiceTitle,
                      {
                        color: colors.text,
                        fontSize: scale(isDesktop ? 14 : 18),
                      },
                    ]}
                  >
                    Alıştırma
                  </CustomText>
                  <View
                    style={[
                      styles.stageDot,
                      {
                        backgroundColor: colors.text + "40",
                        width: scale(isDesktop ? 3 : 4),
                        height: scale(isDesktop ? 3 : 4),
                      },
                    ]}
                  />
                  <CustomText
                    style={[
                      styles.practiceSubtitle,
                      {
                        color: colors.text + "80",
                        fontSize: scale(isDesktop ? 11 : 14),
                      },
                    ]}
                  >
                    Toplam Puan
                  </CustomText>
                </View>
              </View>
            </View>
          ),
        };

      case "duel":
        return {
          content: (
            <TouchableOpacity
              onPress={() => setArenaModalVisible(true)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.modeContainer,
                  isDesktop && { width: "75%", alignSelf: "center" },
                ]}
              >
                <Image
                  source={getDuelBackground()}
                  style={[
                    styles.modeImage,
                    {
                      width: "100%",
                      height: scale(isDesktop ? 140 : 200),
                      borderTopLeftRadius: scale(16),
                      borderTopRightRadius: scale(16),
                    },
                  ]}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.practiceInfoCard,
                    {
                      backgroundColor: colors.card,
                      borderBottomLeftRadius: scale(16),
                      borderBottomRightRadius: scale(16),
                      padding: isDesktop ? scale(12) : 20,
                    },
                  ]}
                >
                  <View style={styles.practiceScoreContainer}>
                    <Ionicons
                      name="flash"
                      size={scale(isDesktop ? 26 : 40)}
                      color={colors.primary}
                    />
                    <CustomText
                      style={[
                        styles.practiceScore,
                        {
                          color: colors.text,
                          fontSize: scale(isDesktop ? 22 : 32),
                        },
                      ]}
                    >
                      {user
                        ? userProgress?.current_trophies?.toLocaleString() ||
                          "0"
                        : "0"}
                    </CustomText>
                  </View>
                  <View style={styles.practiceTextContainer}>
                    <CustomText
                      style={[
                        styles.practiceTitle,
                        {
                          color: colors.text,
                          fontSize: scale(isDesktop ? 14 : 18),
                        },
                      ]}
                    >
                      {currentArena?.name || "Düello"}
                    </CustomText>
                    <View
                      style={[
                        styles.stageDot,
                        {
                          backgroundColor: colors.text + "40",
                          width: scale(isDesktop ? 3 : 4),
                          height: scale(isDesktop ? 3 : 4),
                        },
                      ]}
                    />
                    <CustomText
                      style={[
                        styles.practiceSubtitle,
                        {
                          color: colors.text + "80",
                          fontSize: scale(isDesktop ? 11 : 14),
                        },
                      ]}
                    >
                      Kupa
                    </CustomText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ),
        };
    }
  };

  const modeContent = getModeContent();

  const gameModeOptions: {
    mode: GameMode;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
  }[] = [
    {
      mode: "education",
      title: "Eğitim",
      icon: "school",
      description: "Üniteler ve aşamalar",
    },
    {
      mode: "practice",
      title: "Alıştırma",
      icon: "fitness",
      description: "Filtreli alıştırmalar",
    },
    {
      mode: "duel",
      title: "Düello",
      icon: "git-compare",
      description: "Arkadaşlarınla yarış",
    },
  ];

  const screenContent = (
    <>
      <PullToRefreshScroll
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { paddingBottom: 0 },
        ]}
        stickyHeaderIndices={[0]}
      >
        <View>
          <HomeTopBar />
        </View>

        <HomeInfoBoxes />

        <View
          style={[
            styles.progressContainer,
            { marginTop: scale(isDesktop ? 32 : 20) },
          ]}
        >
          {modeContent.content}
        </View>

        <View
          style={[
            styles.buttonsContainer,
            { marginTop: scale(isDesktop ? 32 : 30) },
            isDesktop && { paddingHorizontal: scale(56) },
          ]}
        >
          <View style={[styles.buttonRow, isDesktop && { gap: scale(28) }]}>
            <TouchableOpacity
              style={[
                styles.sideButton,
                {
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
                isDesktop
                  ? { height: scale(65), borderRadius: scale(12) }
                  : { aspectRatio: 1, borderRadius: 16 },
              ]}
              activeOpacity={0.7}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons
                name="game-controller-outline"
                size={isDesktop ? scale(20) : scale(24)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.sideButtonText,
                  {
                    color: colors.text,
                    fontSize: isDesktop ? scale(11) : scale(12),
                  },
                ]}
              >
                {gameModeOptions.find((opt) => opt.mode === gameMode)?.title ||
                  "Oyun Türü"}
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.startButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
                isDesktop
                  ? { height: scale(75), borderRadius: scale(20) }
                  : { aspectRatio: 1.2, borderRadius: 30 },
              ]}
              activeOpacity={0.8}
              onPress={handleStartPress}
            >
              <CustomText
                style={[
                  styles.startButtonText,
                  {
                    fontSize: isDesktop ? scale(16) : scale(20),
                    color: "white",
                  },
                ]}
              >
                Başla
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sideButton,
                {
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
                isDesktop
                  ? { height: scale(65), borderRadius: scale(12) }
                  : { aspectRatio: 1, borderRadius: 16 },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="apps-outline"
                size={isDesktop ? scale(20) : scale(24)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.sideButtonText,
                  {
                    color: colors.text,
                    fontSize: isDesktop ? scale(11) : scale(12),
                  },
                ]}
              >
                Oyun Seç
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: scale(isDesktop ? 0 : 20) }} />
      </PullToRefreshScroll>

      <BottomSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Oyun Türü Seçin"
        height="60%"
      >
        <View style={styles.modalContent}>
          {gameModeOptions.map((option) => (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.modeOption,
                {
                  backgroundColor:
                    gameMode === option.mode
                      ? colors.primary + "20"
                      : colors.background,
                  borderColor:
                    gameMode === option.mode ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleGameModeSelect(option.mode)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.modeIconContainer,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={scale(28)}
                  color={colors.primary}
                />
              </View>
              <View style={styles.modeTextContainer}>
                <CustomText
                  style={[
                    styles.modeOptionTitle,
                    { color: colors.text, fontSize: scale(16) },
                  ]}
                >
                  {option.title}
                </CustomText>
                <CustomText
                  style={[
                    styles.modeOptionDescription,
                    { color: colors.text + "80", fontSize: scale(12) },
                  ]}
                >
                  {option.description}
                </CustomText>
              </View>
              {gameMode === option.mode && (
                <Ionicons
                  name="checkmark-circle"
                  size={scale(24)}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>

      <ArenaListModal
        visible={arenaModalVisible}
        onClose={() => setArenaModalVisible(false)}
        currentArenaId={currentArena?.arena_number || 1}
        onSelectArena={(arenaId) => {
          console.log("Seçilen arena:", arenaId);
          setArenaModalVisible(false);
        }}
      />

      {/* Uyarı Modalları */}
      <AuthRequiredModal
        visible={authRequiredModalVisible}
        onClose={() => setAuthRequiredModalVisible(false)}
      />

      <DataNotSavedWarningModal
        visible={dataWarningModalVisible}
        onClose={() => setDataWarningModalVisible(false)}
        onContinue={handlePracticeContinueWithoutLogin}
      />
    </>
  );

  if (isDesktop) {
    return <View style={{ flex: 1 }}>{screenContent}</View>;
  }

  return (
    <BackgroundImage overlayOpacity={0.03}>{screenContent}</BackgroundImage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  modeContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  modeImage: {
    width: "100%",
  },
  practiceInfoCard: {
    width: "100%",
    padding: 20,
  },
  practiceScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 12,
  },
  practiceScore: {
    fontWeight: "bold",
  },
  practiceTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    paddingHorizontal: 4,
  },
  practiceTitle: {
    textAlign: "center",
    fontWeight: "600",
  },
  stageDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  practiceSubtitle: {
    textAlign: "center",
    fontWeight: "500",
  },
  buttonsContainer: {
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sideButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sideButtonText: {
    marginTop: 4,
    fontWeight: "500",
  },
  startButton: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    letterSpacing: 1,
    fontWeight: "bold",
  },
  modalContent: {
    gap: 12,
    paddingVertical: 8,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modeTextContainer: {
    flex: 1,
  },
  modeOptionTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  modeOptionDescription: {
    opacity: 0.8,
  },
});
