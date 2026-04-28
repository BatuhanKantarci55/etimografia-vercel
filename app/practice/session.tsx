import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import CompletionScreen from "@components/Practice/CompletionScreen";
import MultipleChoice from "@components/Practice/MultipleChoice";
import ProgressBar from "@components/Practice/ProgressBar";
import Timer from "@components/Practice/Timer";
import WritingQuiz from "@components/Practice/WritingQuiz";
import { usePractice } from "@contexts/PracticeContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

const wordsData = require("@assets/data/words.json");

interface Word {
  id: number;
  old_turkish_word: string;
  old_turkish_origin: string;
  new_turkish_word: string;
  new_turkish_origin: string;
  definition: string;
  old_equivalents: string[];
  new_equivalents: string[];
  difficulty_level: number;
  word_unit: number;
  word_stage: number;
}

type GameMode = "quiz" | "completed" | "timeout";

export default function PracticeSessionScreen() {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();
  const {
    activeSession,
    endPractice,
    updateSessionProgress,
    addMistake,
    filters,
  } = usePractice();

  const [words, setWords] = useState<Word[]>([]);
  const [learningWords, setLearningWords] = useState<Word[]>([]);
  const [currentMode, setCurrentMode] = useState<GameMode>("quiz");
  const [loading, setLoading] = useState(true);
  const [quizProgress, setQuizProgress] = useState({ completed: 0, total: 0 });
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeAdded, setTimeAdded] = useState(0);
  const [score, setScore] = useState(0);
  const [comboProgress, setComboProgress] = useState(0);
  const [isComboActive, setIsComboActive] = useState(false);
  const [passCount, setPassCount] = useState(3); // 3 pas hakkı

  // İlk yükleme için ref - sadece bir kere yükle
  const initialLoadDone = useRef(false);

  // Animasyonlu renk geçişi için
  const scoreBoxColorAnim = useRef(new Animated.Value(0)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;

  // Kelimeleri filtrele ve yükle - SADECE BİR KERE ÇALIŞSIN
  useEffect(() => {
    if (!activeSession || !filters || initialLoadDone.current) return;

    console.log("📚 Practice ilk yükleme - Filtreler:", filters);

    let filteredWords = [...wordsData];

    // Zorluk filtresi
    if (filters.difficulty && filters.difficulty.length > 0) {
      filteredWords = filteredWords.filter((word) =>
        filters.difficulty!.includes(word.difficulty_level),
      );
    }

    // Köken filtresi
    if (filters.origin && filters.origin.length > 0) {
      filteredWords = filteredWords.filter(
        (word) =>
          filters.origin!.includes(word.old_turkish_origin) ||
          filters.origin!.includes(word.new_turkish_origin),
      );
    }

    // Ünite filtresi
    if (filters.unit && filters.unit.length > 0) {
      filteredWords = filteredWords.filter((word) =>
        filters.unit!.includes(word.word_unit),
      );
    }

    // Rastgele karıştır
    const shuffled = filteredWords.sort(() => Math.random() - 0.5);

    console.log(`📋 Kelimeler yüklendi: ${shuffled.length} kelime`);
    setWords(shuffled);
    setLearningWords(shuffled);
    setQuizProgress({ completed: 0, total: shuffled.length });
    setLoading(false);
    initialLoadDone.current = true;
  }, [activeSession, filters]);

  // Kombo durumu değiştiğinde animasyonu başlat
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scoreBoxColorAnim, {
        toValue: isComboActive ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(borderColorAnim, {
        toValue: isComboActive ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: isComboActive ? 1.1 : 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isComboActive]);

  // Arka plan rengi için interpolasyon
  const scoreBoxBackgroundColor = scoreBoxColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.card, "#FFA50020"],
  });

  // Kenarlık rengi için interpolasyon
  const scoreBoxBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, "#FFA500"],
  });

  // Yazı rengi için interpolasyon
  const textColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text, "#FFA500"],
  });

  // İkon rengi - direkt state'e göre
  const getIconColor = () => {
    return isComboActive ? "#FFA500" : "#FFD700";
  };

  const handleTimeOut = useCallback(() => {
    console.log("⏰ Süre doldu!");
    setCurrentMode("timeout");
  }, []);

  const handleTimeAdded = useCallback((addedSeconds: number) => {
    console.log(`⏱️ Süre eklendi: +${addedSeconds} saniye`);
    setTimeAdded(addedSeconds);
    setTimeout(() => setTimeAdded(0), 1000);
  }, []);

  const handleProgress = useCallback(
    (
      completed: number,
      total: number,
      points?: number,
      isCorrect?: boolean,
    ) => {
      console.log(
        `📊 İlerleme: ${completed}/${total}, puan: ${points}, doğru mu: ${isCorrect}`,
      );
      setQuizProgress({ completed, total });

      if (points !== undefined && isCorrect !== undefined) {
        setScore((prev) => prev + points);

        if (isCorrect) {
          updateSessionProgress(true, points);
        } else {
          updateSessionProgress(false, 0);
        }
      }
    },
    [updateSessionProgress],
  );

  const handlePass = useCallback(() => {
    if (passCount > 0) {
      setPassCount((prev) => prev - 1);
    }
  }, [passCount]);

  const handleQuizComplete = useCallback(() => {
    console.log("🎯 Quiz tamamlandı, tebrik ekranına geçiliyor");
    setCurrentMode("completed");
  }, []);

  const handleBackToHome = useCallback(async () => {
    console.log("🏠 Ana sayfaya dönülüyor");
    setExitModalVisible(false);
    await endPractice(true);
    router.back();
  }, [endPractice]);

  const handleExit = useCallback(() => {
    setExitModalVisible(true);
  }, []);

  const handleComboChange = useCallback((active: boolean, progress: number) => {
    setIsComboActive(active);
    setComboProgress(progress);
  }, []);

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={[styles.container, styles.centerContent]}>
          <CustomText style={{ color: colors.text }}>Yükleniyor...</CustomText>
        </View>
      </BackgroundImage>
    );
  }

  const showHeader = currentMode === "quiz";

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* Header */}
        {showHeader && (
          <View
            style={[
              styles.header,
              // DEĞİŞİKLİK: Masaüstünde üst barın boşlukları kısıldı ve genişliği sınırlandırılarak kombo barı daraltıldı
              { paddingTop: scale(isDesktop ? 10 : 50) },
              isDesktop && {
                maxWidth: scale(600),
                alignSelf: "center",
                width: "100%",
                paddingBottom: scale(10),
              },
            ]}
          >
            {/* Süre - Sol */}
            <View
              style={[styles.timerContainer, isDesktop && { width: scale(60) }]}
            >
              <Timer
                initialSeconds={60}
                onTimeOut={handleTimeOut}
                isActive={currentMode === "quiz"}
                addedTime={timeAdded}
              />
            </View>

            {/* Kombo Barı - Orta */}
            <View
              style={[styles.comboBarContainer, isDesktop && { flex: 1.5 }]}
            >
              <ProgressBar
                progress={comboProgress}
                color={isComboActive ? "#FFA500" : colors.primary}
                showComboText={isComboActive}
              />
            </View>

            {/* Puan - Animasyonlu */}
            <Animated.View
              style={[
                styles.scoreBox,
                {
                  backgroundColor: scoreBoxBackgroundColor,
                  borderColor: scoreBoxBorderColor,
                },
                // DEĞİŞİKLİK: Masaüstü için skor kutusu boyutları küçültüldü
                isDesktop && {
                  paddingVertical: scale(4),
                  paddingHorizontal: scale(8),
                  borderRadius: scale(8),
                },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: iconScaleAnim }] }}>
                <Ionicons
                  name="trophy"
                  size={scale(isDesktop ? 14 : 18)}
                  color={getIconColor()}
                />
              </Animated.View>
              <Animated.Text
                style={[
                  styles.scoreText,
                  {
                    color: textColor,
                    fontSize: scale(isDesktop ? 12 : 16),
                  },
                ]}
              >
                {score}
              </Animated.Text>
            </Animated.View>

            {/* X Butonu */}
            <TouchableOpacity
              style={[
                styles.exitButton,
                isDesktop && { width: scale(24), height: scale(24) },
              ]}
              onPress={handleExit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={scale(isDesktop ? 16 : 28)}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Ana İçerik */}
        <View
          style={[
            styles.content,
            !showHeader && { marginTop: scale(20) },
            isDesktop && {
              maxWidth: scale(500),
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          {currentMode === "quiz" &&
            activeSession?.type === "multiple-choice" && (
              <MultipleChoice
                words={learningWords}
                onProgress={handleProgress}
                onComplete={handleQuizComplete}
                direction={activeSession.direction}
                // DEĞİŞİKLİK: Çifte puan sorunu engellendi (onPointsEarned prop'u kaldırıldı)
                onMistake={(wordId, wordText) => addMistake(wordId, wordText)}
                onComboChange={handleComboChange}
                onTimeAdded={handleTimeAdded}
                passCount={passCount}
                onPass={handlePass}
              />
            )}

          {currentMode === "quiz" && activeSession?.type === "classic" && (
            <WritingQuiz
              words={learningWords}
              onProgress={handleProgress}
              onComplete={handleQuizComplete}
              onTimeAdded={handleTimeAdded}
              direction={activeSession.direction}
              // DEĞİŞİKLİK: Çifte puan sorunu engellendi (onPointsEarned prop'u kaldırıldı)
              onMistake={(wordId, wordText) => addMistake(wordId, wordText)}
              onComboChange={handleComboChange}
              passCount={passCount}
              onPass={handlePass}
            />
          )}

          {(currentMode === "completed" || currentMode === "timeout") && (
            <CompletionScreen
              type={currentMode === "completed" ? "success" : "timeout"}
              wordCount={quizProgress.completed}
              totalWords={words.length}
              score={score}
              onHomePress={handleBackToHome}
            />
          )}
        </View>

        {/* Çıkış Modalı */}
        <Modal
          visible={exitModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setExitModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setExitModalVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
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
                    {
                      color: colors.text,
                      fontSize: scale(isDesktop ? 13 : 18),
                    },
                  ]}
                >
                  Çıkış Yap
                </CustomText>
                <TouchableOpacity onPress={() => setExitModalVisible(false)}>
                  <Ionicons
                    name="close"
                    size={scale(isDesktop ? 16 : 24)}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <CustomText
                style={[
                  styles.modalMessage,
                  {
                    color: colors.text + "CC",
                    fontSize: scale(isDesktop ? 11 : 14),
                    lineHeight: scale(isDesktop ? 14 : 20),
                    marginTop: scale(8),
                    textAlign: "left",
                  },
                ]}
              >
                Çıkış yapmak istediğinizden emin misiniz? İlerlemeniz
                kaydedilmeyecek.
              </CustomText>

              <View
                style={[
                  styles.modalButtons,
                  { marginTop: scale(isDesktop ? 8 : 12) },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalCancelButton,
                    { backgroundColor: colors.primary + "20" },
                    isDesktop && { paddingVertical: scale(8) },
                  ]}
                  onPress={() => setExitModalVisible(false)}
                >
                  <CustomText
                    style={[
                      styles.modalButtonText,
                      {
                        color: colors.text,
                        fontSize: scale(isDesktop ? 11 : 14),
                      },
                    ]}
                  >
                    Vazgeç
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalConfirmButton,
                    { backgroundColor: "#F44336" },
                    isDesktop && { paddingVertical: scale(8) },
                  ]}
                  onPress={handleBackToHome}
                >
                  <CustomText
                    style={[
                      styles.modalButtonText,
                      { color: "white", fontSize: scale(isDesktop ? 11 : 14) },
                    ]}
                  >
                    Çıkış Yap
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  timerContainer: {
    width: 70,
    alignItems: "center",
  },
  comboBarContainer: {
    flex: 2,
    marginHorizontal: 4,
  },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    marginHorizontal: 4,
  },
  scoreText: {
    fontWeight: "600",
  },
  exitButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    width: "100%",
  },
  infoModalTitle: {
    fontWeight: "600",
    flex: 1,
  },
  modalTitle: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  modalMessage: {
    textAlign: "center",
    marginBottom: 20,
  },
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
  modalCancelButton: {
    borderWidth: 0,
  },
  modalConfirmButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
