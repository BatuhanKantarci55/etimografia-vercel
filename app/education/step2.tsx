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
import DefinitionQuiz from "@components/Education/Step2/DefinitionQuiz";
import MatchingGame from "@components/Education/Step2/MatchingGame";
import MultipleChoice from "@components/Education/Step2/MultipleChoice";
import TransitionScreen from "@components/Education/Step2/TransitionScreen";
import { useSound } from "@hooks/useSound";

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

interface CorrectAnswer {
  wordId: number;
  difficulty: number;
}

type GameMode =
  | "multiple-choice"
  | "matching"
  | "definition"
  | "transition"
  | "completed";

export default function Step2Screen() {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { unitId = 1, stageId = 1 } = useLocalSearchParams();
  const { playSound } = useSound();
  const {
    getLearningWordsForCurrentStage,
    goToNextStep,
    getStepPoints,
    addEducationPoints,
    progress,
  } = useEducation();

  const [words, setWords] = useState<Word[]>([]);
  const [learningWords, setLearningWords] = useState<Word[]>([]);
  const [currentMode, setCurrentMode] = useState<GameMode>("multiple-choice");
  const [loading, setLoading] = useState(true);
  const [mcProgress, setMcProgress] = useState({ completed: 0, total: 0 });
  const [matchingProgress, setMatchingProgress] = useState({
    completed: 0,
    total: 0,
  });
  const [definitionProgress, setDefinitionProgress] = useState({
    completed: 0,
    total: 0,
  });
  const [transitionMessage, setTransitionMessage] = useState("");
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [stats, setStats] = useState({ learning: 0, known: 0, total: 0 });
  const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswer[]>([]);
  const [points, setPoints] = useState({
    step1Points: 0,
    step2Points: 0,
    step3Points: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    console.log(`📚 Step2 yükleniyor - Unit: ${unitId}, Stage: ${stageId}`);

    const learningWords = getLearningWordsForCurrentStage();

    console.log(`📋 Öğrenilecek kelimeler: ${learningWords.length}`);

    setLearningWords(learningWords);
    setWords(learningWords);
    setMcProgress({ completed: 0, total: learningWords.length });
    setMatchingProgress({ completed: 0, total: learningWords.length });
    setDefinitionProgress({ completed: 0, total: learningWords.length });

    setStats({
      learning: learningWords.length,
      known: 0,
      total: learningWords.length,
    });

    setLoading(false);
  }, [unitId, stageId, getLearningWordsForCurrentStage]);

  const handleMultipleChoiceProgress = useCallback(
    (completed: number, total: number) => {
      console.log(`📊 Çoktan seçmeli ilerleme: ${completed}/${total}`);
      setMcProgress({ completed, total });
    },
    [],
  );

  const handleMultipleChoiceCorrect = useCallback(
    (wordId: number, difficulty: number) => {
      setCorrectAnswers((prev) => [...prev, { wordId, difficulty }]);
    },
    [],
  );

  const handleMultipleChoiceFinish = useCallback(() => {
    console.log("🎯 Çoktan seçmeli tamamlandı, geçiş ekranına geçiliyor");
    setTransitionMessage(
      "Tebrikler, çoktan seçmeli bölümünü tamamladınız. Hazırsanız eşleştirme kısmına geçelim.",
    );
    setCurrentMode("transition");
  }, []);

  const handleMatchingProgress = useCallback(
    (completed: number, total: number) => {
      console.log(`📊 Eşleştirme ilerleme: ${completed}/${total}`);
      setMatchingProgress({ completed, total });
    },
    [],
  );

  const handleMatchingCorrect = useCallback(
    (wordId: number, difficulty: number) => {
      setCorrectAnswers((prev) => [...prev, { wordId, difficulty }]);
    },
    [],
  );

  const handleMatchingComplete = useCallback(() => {
    console.log("🎯 Eşleştirme tamamlandı, geçiş ekranına geçiliyor");
    setTransitionMessage(
      "Tebrikler, eşleştirme bölümünü tamamladınız. Hazırsanız tanım quizi kısmına geçelim.",
    );
    setCurrentMode("transition");
  }, []);

  const handleDefinitionProgress = useCallback(
    (completed: number, total: number) => {
      console.log(`📊 Tanım quizi ilerleme: ${completed}/${total}`);
      setDefinitionProgress({ completed, total });
    },
    [],
  );

  const handleDefinitionCorrect = useCallback(
    (wordId: number, difficulty: number) => {
      setCorrectAnswers((prev) => [...prev, { wordId, difficulty }]);
    },
    [],
  );

  const handleDefinitionComplete = useCallback(async () => {
    console.log("🎯 Tanım quizi tamamlandı");
    playSound("complete");

    const stepPoints = getStepPoints(2, correctAnswers);
    setPoints(stepPoints);

    await addEducationPoints(stepPoints.totalPoints);
    await goToNextStep();

    setCompletionVisible(true);
  }, [
    playSound,
    goToNextStep,
    correctAnswers,
    getStepPoints,
    addEducationPoints,
  ]);

  const handleTransitionNext = useCallback(() => {
    console.log(
      "👉 Geçiş ekranından devam ediliyor - currentMode:",
      currentMode,
    );

    if (currentMode === "transition") {
      if (transitionMessage.includes("çoktan seçmeli")) {
        console.log("🎯 Çoktan seçmeli -> Eşleştirme");
        setCurrentMode("matching");
      } else if (transitionMessage.includes("eşleştirme")) {
        console.log("🎯 Eşleştirme -> Tanım quizi");
        setCurrentMode("definition");
      }
    }
  }, [currentMode, transitionMessage]);

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
    setCompletionVisible(false);
    router.back();
  }, []);

  const getTotalProgress = () => {
    const totalPerSection = words.length;
    if (totalPerSection === 0) return 0;

    const totalSteps = totalPerSection * 3;

    const mcCompleted = mcProgress.completed;
    const matchingCompleted = matchingProgress.completed;
    const definitionCompleted = definitionProgress.completed;

    const totalCompleted =
      mcCompleted + matchingCompleted + definitionCompleted;
    const progress = totalCompleted / totalSteps;

    return progress;
  };

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={[styles.container, styles.centerContent]}>
          <CustomText style={{ color: colors.text }}>Yükleniyor...</CustomText>
        </View>
      </BackgroundImage>
    );
  }

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
            Öğrenilecek kelime bulunmuyor. Tüm kelimeleri biliyorsunuz!
          </CustomText>
          <TouchableOpacity
            style={[
              styles.completedButton,
              {
                backgroundColor: colors.primary,
                paddingHorizontal: scale(40),
                paddingVertical: scale(15),
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
                fontSize: scale(18),
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

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        <View
          style={[
            styles.header,
            { paddingTop: scale(isDesktop ? 10 : 50) },
            isDesktop && {
              maxWidth: scale(600),
              alignSelf: "center",
              width: "100%",
              paddingBottom: scale(10),
            },
          ]}
        >
          {/* DEĞİŞİKLİK: Masaüstünde ilerleme barını ortalayabilmek için sol boşluk tutucunun (Timer alanı) genişliği, sağdaki X butonuyla tam eşitlendi (24px) */}
          <View
            style={[styles.timerContainer, isDesktop && { width: scale(24) }]}
          />

          <View style={styles.progressContainer}>
            <ProgressBar progress={getTotalProgress()} />
          </View>

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

        {/* Ana İçerik */}
        <View style={styles.content}>
          {currentMode === "multiple-choice" && (
            <MultipleChoice
              words={learningWords}
              onProgress={handleMultipleChoiceProgress}
              onComplete={handleMultipleChoiceFinish}
              onCorrect={handleMultipleChoiceCorrect}
            />
          )}

          {currentMode === "transition" && (
            <TransitionScreen
              message={transitionMessage}
              onNext={handleTransitionNext}
            />
          )}

          {currentMode === "matching" && (
            <MatchingGame
              words={learningWords}
              onProgress={handleMatchingProgress}
              onComplete={handleMatchingComplete}
              onCorrect={handleMatchingCorrect}
            />
          )}

          {currentMode === "definition" && (
            <DefinitionQuiz
              words={learningWords}
              onProgress={handleDefinitionProgress}
              onComplete={handleDefinitionComplete}
              onCorrect={handleDefinitionCorrect}
            />
          )}

          {currentMode === "completed" && (
            <View style={styles.completedContainer}>
              <Ionicons
                name="checkmark-done-circle"
                size={scale(100)}
                color={colors.primary}
              />

              <CustomText
                style={[
                  styles.completedTitle,
                  { color: colors.text, fontSize: scale(24) },
                ]}
              >
                Tebrikler!
              </CustomText>

              <CustomText
                style={[
                  styles.completedSubtitle,
                  { color: colors.text + "80", fontSize: scale(16) },
                ]}
              >
                2. adımı başarıyla tamamladınız.
              </CustomText>

              <TouchableOpacity
                style={[
                  styles.completedButton,
                  {
                    backgroundColor: colors.primary,
                    paddingHorizontal: scale(40),
                    paddingVertical: scale(15),
                    borderRadius: scale(30),
                    marginTop: scale(30),
                  },
                ]}
                onPress={() => setCompletionVisible(true)}
                activeOpacity={0.8}
              >
                <CustomText
                  style={{
                    color: "white",
                    fontSize: scale(18),
                    fontWeight: "600",
                  }}
                >
                  Tamamla
                </CustomText>
              </TouchableOpacity>
            </View>
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

        {/* Tamamlama Modalı */}
        <CompletionModal
          visible={completionVisible}
          onClose={handleCompletionClose}
          step={2}
          stats={stats}
          points={points}
          nextStep={3}
          unitId={Number(unitId)}
          stageId={Number(stageId)}
        />
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
    width: 40,
    alignItems: "center",
  },
  exitButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  completedTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  completedSubtitle: {
    textAlign: "center",
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
