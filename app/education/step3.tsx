import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import CompletionModal from "@components/Education/CompletionModal";
import { useEducation } from "@contexts/EducationContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import ProgressBar from "@components/Education/common/ProgressBar";
import Timer from "@components/Education/Step3/Timer";
import WritingQuiz from "@components/Education/Step3/WritingQuiz";
import { useSound } from "@hooks/useSound";

const wordsData = require("@assets/data/words.json");

interface Word {
  id: number;
  old_turkish_word: string;
  new_turkish_word: string;
  definition: string;
  old_equivalents: string[];
  word_unit: number;
  word_stage: number;
  difficulty_level: number;
}

interface CorrectAnswer {
  wordId: number;
  difficulty: number;
}

type GameMode = "quiz" | "completed" | "timeout";

export default function Step3Screen() {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();
  const { unitId = 1, stageId = 1 } = useLocalSearchParams();
  const { playSound } = useSound();
  const {
    getLearningWordsForCurrentStage,
    getKnownWordsForCurrentStage,
    completeCurrentStage,
    goToNextStep,
    getStepPoints,
    addEducationPoints,
    progress,
  } = useEducation();

  const [words, setWords] = useState<Word[]>([]);
  const [learningWords, setLearningWords] = useState<Word[]>([]);
  const [currentMode, setCurrentMode] = useState<GameMode>("quiz");
  const [loading, setLoading] = useState(true);
  const [quizProgress, setQuizProgress] = useState({ completed: 0, total: 0 });
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeAdded, setTimeAdded] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [stats, setStats] = useState({ learning: 0, known: 0, total: 0 });
  const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswer[]>([]);
  const [points, setPoints] = useState({
    step1Points: 0,
    step2Points: 0,
    step3Points: 0,
    totalPoints: 0,
  });

  // Kelimeleri yükle - tüm kelimeler (öğrenilecekler + bilinenler)
  useEffect(() => {
    console.log(`📚 Step3 yükleniyor - Unit: ${unitId}, Stage: ${stageId}`);

    const learningWords = getLearningWordsForCurrentStage();
    const knownWords = getKnownWordsForCurrentStage();

    // Tüm kelimeleri birleştir ve karıştır
    const allWords = [...learningWords, ...knownWords].sort(
      () => Math.random() - 0.5,
    );

    console.log(
      `📋 Toplam kelime: ${allWords.length} (Öğrenilecek: ${learningWords.length}, Bilinen: ${knownWords.length})`,
    );

    setLearningWords(allWords);
    setWords(allWords);
    setQuizProgress({ completed: 0, total: allWords.length });

    setStats({
      learning: learningWords.length,
      known: knownWords.length,
      total: allWords.length,
    });

    setLoading(false);
  }, [
    unitId,
    stageId,
    getLearningWordsForCurrentStage,
    getKnownWordsForCurrentStage,
  ]);

  const handleTimeOut = useCallback(() => {
    console.log("⏰ Süre doldu!");
    setCurrentMode("timeout");
    setCompletionVisible(true);
  }, []);

  const handleTimeAdded = useCallback((addedSeconds: number) => {
    console.log(`⏱️ Süre eklendi: +${addedSeconds} saniye`);
    setTimeAdded(addedSeconds);
    setTimeout(() => setTimeAdded(0), 1000);
  }, []);

  const handleProgress = useCallback((completed: number, total: number) => {
    console.log(`📊 İlerleme: ${completed}/${total}`);
    setQuizProgress({ completed, total });
  }, []);

  const handleCorrectAnswer = useCallback(
    (wordId: number, difficulty: number) => {
      setCorrectAnswers((prev) => [...prev, { wordId, difficulty }]);
    },
    [],
  );

  const handleQuizComplete = useCallback(async () => {
    console.log("🎯 Quiz tamamlandı");
    playSound("complete");

    try {
      // Puan hesapla
      const stepPoints = getStepPoints(3, correctAnswers);
      setPoints(stepPoints);

      // Puanları ekle
      await addEducationPoints(stepPoints.totalPoints);

      // Aşamayı tamamla (kelime durumlarını temizle)
      await completeCurrentStage();

      // Bir sonraki aşamaya geç
      await goToNextStep();

      console.log("✅ Aşama tamamlandı ve sonraki aşamaya geçildi");

      setQuizCompleted(true);
      setCurrentMode("completed");
      setCompletionVisible(true);
    } catch (error) {
      console.error("Quiz tamamlama hatası:", error);
      setCompletionVisible(true);
    }
  }, [
    playSound,
    completeCurrentStage,
    goToNextStep,
    correctAnswers,
    getStepPoints,
    addEducationPoints,
  ]);

  const handleBackToHome = useCallback(() => {
    console.log("🏠 Ana sayfaya dönülüyor");
    setExitModalVisible(false);
    setCompletionVisible(false);
    router.back();
  }, []);

  const handleExit = useCallback(() => {
    if (Platform.OS === "web") {
      if (
        confirm(
          "Çıkış yapmak istediğinizden emin misiniz?\nİlerlemeniz kaydedilmeyecek.",
        )
      ) {
        handleBackToHome();
      }
    } else {
      setExitModalVisible(true);
    }
  }, [handleBackToHome]);

  const handleCompletionClose = useCallback(() => {
    console.log("🔚 Tamamlama modalı kapatılıyor, ana sayfaya dönülüyor");
    setCompletionVisible(false);
    router.back();
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

  // ÖNEMLİ: Eğer completionVisible true ise, kelime kontrolünü atla ve modalı göster
  if (completionVisible) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={[styles.container, styles.centerContent]}>
          <CompletionModal
            visible={completionVisible}
            onClose={handleCompletionClose}
            step={3}
            stats={stats}
            points={points}
            unitId={Number(unitId)}
            stageId={Number(stageId)}
            isLastStep={true}
          />
        </View>
      </BackgroundImage>
    );
  }

  // Kelime yoksa direkt ana sayfaya dön (ama completionVisible değilse)
  if (words.length === 0) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={[styles.container, styles.centerContent]}>
          <CustomText
            style={{
              color: colors.text,
              fontSize: scale(18),
              textAlign: "center",
            }}
          >
            Bu aşamada kelime bulunmuyor.
          </CustomText>
          <TouchableOpacity
            style={[
              styles.completedButton,
              {
                backgroundColor: colors.primary,
                paddingHorizontal: scale(40),
                paddingVertical: scale(isDesktop ? 10 : 15), // DEĞİŞİKLİK: Masaüstü boşluklar azaltıldı
                borderRadius: scale(30),
                marginTop: scale(30),
              },
            ]}
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <CustomText
              style={{
                color: "white",
                fontSize: scale(isDesktop ? 14 : 18), // DEĞİŞİKLİK: Masaüstü font küçültüldü
                fontWeight: "600",
              }}
            >
              Ana Sayfaya Dön
            </CustomText>
          </TouchableOpacity>
        </View>
      </BackgroundImage>
    );
  }

  // Süre bittiğinde veya tamamlandığında header'ı gizle
  const showHeader = currentMode === "quiz";

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* Header - Sadece quiz modundayken göster */}
        {showHeader && (
          <View
            style={[
              styles.header,
              // DEĞİŞİKLİK: Masaüstünde header üst boşluğu kısıldı, genişlik sınırlandırılarak bar yatayda kısaltıldı
              { paddingTop: scale(isDesktop ? 10 : 50) },
              isDesktop && {
                maxWidth: scale(600),
                alignSelf: "center",
                width: "100%",
                paddingBottom: scale(10),
              },
            ]}
          >
            {/* Sayaç - Sol */}
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

            {/* İlerleme Barı - Orta */}
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={quizProgress.completed / quizProgress.total}
              />
            </View>

            {/* X Butonu - Sağ */}
            <TouchableOpacity
              style={[
                styles.exitButton,
                // DEĞİŞİKLİK: Masaüstünde X butonu küçültüldü
                isDesktop && { width: scale(24), height: scale(24) },
              ]}
              onPress={handleExit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={scale(isDesktop ? 16 : 28)} // DEĞİŞİKLİK: Masaüstü X ikonu küçültüldü
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Ana İçerik */}
        <View style={[styles.content, !showHeader && { marginTop: scale(20) }]}>
          {currentMode === "quiz" && (
            <WritingQuiz
              words={learningWords}
              onProgress={handleProgress}
              onComplete={handleQuizComplete}
              onTimeAdded={handleTimeAdded}
              onCorrect={handleCorrectAnswer}
            />
          )}
        </View>

        {/* Çıkış Onay Modalı */}
        <Modal
          visible={exitModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setExitModalVisible(false)}
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
                Çıkış Yap
              </CustomText>

              <CustomText
                style={[
                  styles.modalMessage,
                  { color: colors.text + "80", fontSize: scale(16) },
                ]}
              >
                Çıkış yapmak istediğinizden emin misiniz? İlerlemeniz
                kaydedilmeyecek.
              </CustomText>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalCancelButton,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                  onPress={() => setExitModalVisible(false)}
                >
                  <CustomText
                    style={[styles.modalButtonText, { color: colors.text }]}
                  >
                    Vazgeç
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalConfirmButton,
                    { backgroundColor: "#F44336" },
                  ]}
                  onPress={handleBackToHome}
                >
                  <CustomText
                    style={[styles.modalButtonText, { color: "white" }]}
                  >
                    Çıkış Yap
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
    gap: 12,
  },
  timerContainer: {
    width: 70,
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
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
  completedButton: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
