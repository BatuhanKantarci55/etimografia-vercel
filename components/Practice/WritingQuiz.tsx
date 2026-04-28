import CustomText from "@components/CustomText";
import AnimatedBird from "@components/Practice/AnimatedBird";
import InputBox from "@components/Practice/InputBox";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useSound } from "@hooks/useSound";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"; // DEĞİŞİKLİK: Platform eklendi

interface Word {
  id: number;
  old_turkish_word: string;
  new_turkish_word: string;
  difficulty_level: number;
}

interface WritingQuizProps {
  words: Word[];
  onProgress: (
    completed: number,
    total: number,
    points?: number,
    isCorrect?: boolean,
  ) => void;
  onComplete: () => void;
  onTimeAdded: (seconds: number) => void;
  direction: "old-to-new" | "new-to-old";
  onPointsEarned?: (points: number) => void;
  onMistake?: (wordId: number, wordText: string) => void;
  onComboChange?: (isComboActive: boolean, progress: number) => void;
  passCount?: number;
  onPass?: () => void;
}

const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

const hasAdjacentTransposition = (
  userWord: string,
  correctWord: string,
): boolean => {
  if (userWord.length !== correctWord.length) return false;

  let diffCount = 0;
  let firstDiffIndex = -1;

  for (let i = 0; i < userWord.length; i++) {
    if (userWord[i] !== correctWord[i]) {
      diffCount++;
      if (firstDiffIndex === -1) {
        firstDiffIndex = i;
      }
    }
  }

  if (
    diffCount === 2 &&
    firstDiffIndex !== -1 &&
    firstDiffIndex + 1 < userWord.length
  ) {
    if (userWord[firstDiffIndex] !== correctWord[firstDiffIndex + 1]) {
      return false;
    }
    if (userWord[firstDiffIndex + 1] !== correctWord[firstDiffIndex]) {
      return false;
    }

    for (let i = 0; i < userWord.length; i++) {
      if (i !== firstDiffIndex && i !== firstDiffIndex + 1) {
        if (userWord[i] !== correctWord[i]) {
          return false;
        }
      }
    }

    return true;
  }

  return false;
};

export default function WritingQuiz({
  words,
  onProgress,
  onComplete,
  onTimeAdded,
  direction,
  onPointsEarned,
  onMistake,
  onComboChange,
  passCount = 3,
  onPass,
}: WritingQuizProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { playSound } = useSound();

  const [queue, setQueue] = useState<{ word: Word; wrongCount: number }[]>([]);
  const [currentItem, setCurrentItem] = useState<{
    word: Word;
    wrongCount: number;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [isCloseMatch, setIsCloseMatch] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalWords] = useState(words.length);
  const [buttonMode, setButtonMode] = useState<"check" | "next">("check");
  const [birdAnimation, setBirdAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<"correct" | "wrong">(
    "correct",
  );
  const [inputKey, setInputKey] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [isComboActive, setIsComboActive] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  // DEĞİŞİKLİK: React Hook state'lerini dinleyebilmek için klavye olaylarında kullanılacak olan ref
  const handlersRef = useRef({ handleNext: () => {} });

  useEffect(() => {
    handlersRef.current = { handleNext };
  });

  // DEĞİŞİKLİK: Web üzerinde Enter tuşunu dinleyerek "İleri" butonunu tetikleme eklendi
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Yalnızca "İleri" modundayken Enter tuşuyla sıradaki soruya geçiş yap
      if (
        buttonMode === "next" &&
        !isTransitioning.current &&
        e.key === "Enter"
      ) {
        handlersRef.current.handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buttonMode]);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {});

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const initialQueue = words.map((word) => ({ word, wrongCount: 0 }));
    const shuffled = initialQueue.sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentItem(shuffled[0]);
  }, [words]);

  useEffect(() => {
    if (currentItem) {
      setInputValue("");
      setShowResult(false);
      setIsExactMatch(false);
      setIsCloseMatch(false);
      setButtonMode("check");
      isTransitioning.current = false;
      setInputKey((prev) => prev + 1);
    }
  }, [currentItem, direction]);

  useEffect(() => {
    const progress = comboCount / 5;
    onComboChange?.(isComboActive, Math.min(progress, 1));
  }, [isComboActive, comboCount]);

  const resetCombo = () => {
    setComboCount(0);
    setIsComboActive(false);
  };

  const activateCombo = () => {
    setIsComboActive(true);
    playSound("combo");
  };

  const checkAnswer = (userAnswer: string, correctAnswer: string) => {
    const user = userAnswer.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();

    if (user.length !== correct.length) {
      return { exactMatch: false, closeMatch: false };
    }

    if (user === correct) {
      return { exactMatch: true, closeMatch: false };
    }

    if (hasAdjacentTransposition(user, correct)) {
      return { exactMatch: false, closeMatch: true };
    }

    const distance = levenshteinDistance(user, correct);

    if (distance === 1) {
      return { exactMatch: false, closeMatch: true };
    }

    return { exactMatch: false, closeMatch: false };
  };

  const handleCheck = () => {
    if (showResult || isTransitioning.current || !currentItem) return;

    if (!inputValue.trim()) {
      return;
    }

    if (inputValue.trim().toLowerCase() === "pas" && passCount > 0 && onPass) {
      onPass();

      isTransitioning.current = true;

      const newQueue = queue.filter(
        (item) => item.word.id !== currentItem.word.id,
      );

      const updatedItem = {
        ...currentItem,
        wrongCount: currentItem.wrongCount + 1,
      };
      newQueue.push(updatedItem);
      setQueue(newQueue);

      if (newQueue.length > 0) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setCurrentItem(newQueue[0]);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      }

      setInputValue("");
      return;
    }

    const correctAnswer =
      direction === "old-to-new"
        ? currentItem.word.new_turkish_word
        : currentItem.word.old_turkish_word;

    const result = checkAnswer(inputValue, correctAnswer);

    setIsExactMatch(result.exactMatch);
    setIsCloseMatch(result.closeMatch);
    setShowResult(true);
    setButtonMode("next");

    if (result.exactMatch || result.closeMatch) {
      playSound("correct");
      setAnimationType("correct");

      onTimeAdded(1);

      let points = (currentItem.word.difficulty_level || 1) * 2;

      if (isComboActive) {
        points *= 2;
      }

      if (result.closeMatch && !result.exactMatch) {
        points = Math.floor(points / 2);
      }

      onPointsEarned?.(points);

      const newComboCount = comboCount + 1;
      setComboCount(newComboCount);

      if (newComboCount >= 5 && !isComboActive) {
        activateCombo();
      }

      const newCompletedCount = completedCount + 1;
      setCompletedCount(newCompletedCount);
      onProgress(newCompletedCount, totalWords, points, true);
    } else {
      playSound("wrong");
      setAnimationType("wrong");

      resetCombo();

      if (onMistake && currentItem) {
        onMistake(currentItem.word.id, currentItem.word.old_turkish_word);
      }

      const penaltyPoints = -2;
      onPointsEarned?.(penaltyPoints);
      onProgress(completedCount, totalWords, penaltyPoints, false);
    }

    setBirdAnimation(true);
    Keyboard.dismiss();
  };

  const handlePass = () => {
    if (passCount > 0 && onPass && !isTransitioning.current && !showResult) {
      onPass();

      if (!currentItem) return;

      isTransitioning.current = true;

      const newQueue = queue.filter(
        (item) => item.word.id !== currentItem.word.id,
      );

      const updatedItem = {
        ...currentItem,
        wrongCount: currentItem.wrongCount + 1,
      };
      newQueue.push(updatedItem);
      setQueue(newQueue);

      if (newQueue.length > 0) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setCurrentItem(newQueue[0]);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      }
    }
  };

  const handleNext = () => {
    if (!currentItem || isTransitioning.current) return;

    isTransitioning.current = true;

    if (isExactMatch || isCloseMatch) {
      const newQueue = queue.filter(
        (item) => item.word.id !== currentItem.word.id,
      );
      setQueue(newQueue);

      if (newQueue.length > 0) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setCurrentItem(newQueue[0]);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      } else {
        onComplete();
      }
    } else {
      const newQueue = queue.filter(
        (item) => item.word.id !== currentItem.word.id,
      );
      const updatedItem = {
        ...currentItem,
        wrongCount: currentItem.wrongCount + 1,
      };
      newQueue.push(updatedItem);
      setQueue(newQueue);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentItem(newQueue[0]);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleBirdAnimationComplete = () => {
    setBirdAnimation(false);
  };

  const handleSubmit = () => {
    if (buttonMode === "check") {
      handleCheck();
    } else {
      handleNext();
    }
  };

  const isCheckButtonActive =
    buttonMode === "check" && inputValue.trim().length > 0 && !showResult;

  if (!currentItem) {
    return (
      <View style={styles.container}>
        <CustomText style={{ color: colors.text }}>Yükleniyor...</CustomText>
      </View>
    );
  }

  const questionWord =
    direction === "old-to-new"
      ? currentItem.word.old_turkish_word
      : currentItem.word.new_turkish_word;

  const correctAnswer =
    direction === "old-to-new"
      ? currentItem.word.new_turkish_word
      : currentItem.word.old_turkish_word;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
        isDesktop && {
          maxWidth: scale(500),
          alignSelf: "center",
          width: "100%",
        },
      ]}
    >
      <View
        style={[
          styles.mascotContainer,
          // DEĞİŞİKLİK: Masaüstünde içerik dikeyde ortalanması için üst boşluk artırıldı (10 -> 80)
          { marginTop: scale(isDesktop ? 80 : 60) },
        ]}
      >
        <AnimatedBird
          // DEĞİŞİKLİK: Masaüstünde kuş maskotu biraz büyütüldü (80 -> 110)
          size={isDesktop ? 110 : 140}
          triggerAnimation={birdAnimation}
          animationType={animationType}
          onAnimationComplete={handleBirdAnimationComplete}
          gifDuration={1500}
        />
        <View style={[styles.bubbleWrapper, { marginLeft: scale(12) }]}>
          <View
            style={[
              styles.whatsappBubble,
              { backgroundColor: colors.card, borderColor: colors.border },
              isDesktop && {
                paddingVertical: scale(8),
                paddingHorizontal: scale(12),
                minHeight: scale(36),
              },
            ]}
          >
            <CustomText
              style={[
                styles.bubbleText,
                { color: colors.text, fontSize: scale(isDesktop ? 14 : 24) },
              ]}
            >
              {questionWord}
            </CustomText>
          </View>
          <View
            style={[styles.whatsappTail, { borderRightColor: colors.card }]}
          />
        </View>
      </View>

      <View style={styles.difficultyContainer}>
        {Array.from({ length: currentItem.word.difficulty_level }).map(
          (_, i) => (
            <Ionicons
              key={i}
              name="star"
              size={scale(isDesktop ? 14 : 20)}
              color="#FFD700"
            />
          ),
        )}
      </View>

      <View
        style={[
          styles.instructionContainer,
          {
            marginTop: scale(isDesktop ? 5 : 10),
            marginBottom: scale(isDesktop ? 10 : 20),
          },
        ]}
      >
        <CustomText
          style={[
            styles.instructionText,
            {
              color: colors.text + "80",
              fontSize: scale(14),
            },
          ]}
        >
          {direction === "old-to-new"
            ? "Bu kelimenin yeni Türkçe karşılığını yazınız."
            : "Bu kelimenin eski Türkçe karşılığını yazınız."}
        </CustomText>
      </View>

      <View
        style={[
          styles.inputContainer,
          { marginBottom: scale(isDesktop ? 10 : 20) },
        ]}
      >
        <InputBox
          key={inputKey}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmit={handleSubmit}
          placeholder="Cevabınızı yazın veya 'pas' yazın..."
          disabled={showResult}
          showResult={showResult}
          isCorrect={isExactMatch}
          isCloseMatch={isCloseMatch}
          correctAnswer={
            !isExactMatch && showResult ? correctAnswer : undefined
          }
          autoFocus={true}
        />
      </View>

      <View
        style={[
          styles.bottomContainer,
          isDesktop && { marginTop: scale(5), marginBottom: scale(10) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.passButton,
            {
              backgroundColor: passCount > 0 ? colors.card : colors.card + "80",
              borderColor: colors.border,
              opacity:
                passCount > 0 && !showResult && !isTransitioning.current
                  ? 1
                  : 0.5,
              paddingVertical: scale(isDesktop ? 8 : 12),
              paddingHorizontal: scale(isDesktop ? 12 : 16),
            },
          ]}
          onPress={handlePass}
          disabled={passCount === 0 || showResult || isTransitioning.current}
          activeOpacity={0.7}
        >
          <Ionicons
            name="play-skip-forward"
            size={scale(isDesktop ? 14 : 20)}
            color={passCount > 0 ? colors.primary : colors.text + "40"}
          />
          <CustomText
            style={[
              styles.passButtonText,
              {
                color: passCount > 0 ? colors.primary : colors.text + "40",
                fontSize: scale(isDesktop ? 11 : 14),
                marginLeft: scale(4),
              },
            ]}
          >
            {passCount}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor:
                buttonMode === "check"
                  ? isCheckButtonActive
                    ? colors.primary
                    : colors.card
                  : colors.primary,
              borderColor: colors.border,
              opacity:
                (buttonMode === "check" && !isCheckButtonActive) ||
                isTransitioning.current
                  ? 0.5
                  : 1,
              paddingVertical: scale(isDesktop ? 8 : 14),
              paddingHorizontal: scale(isDesktop ? 20 : 30),
              borderRadius: scale(28),
            },
          ]}
          onPress={handleSubmit}
          disabled={
            isTransitioning.current ||
            (buttonMode === "check" && !isCheckButtonActive)
          }
          activeOpacity={0.8}
        >
          <CustomText
            style={[
              styles.actionButtonText,
              {
                color:
                  buttonMode === "check" && !isCheckButtonActive
                    ? colors.text + "80"
                    : "white",
                fontSize: scale(isDesktop ? 12 : 16),
              },
            ]}
          >
            {buttonMode === "check" ? "Kontrol Et" : "İleri"}
          </CustomText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mascotContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  bubbleWrapper: {
    flex: 1,
    position: "relative",
  },
  whatsappBubble: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderTopLeftRadius: 5,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  bubbleText: {
    textAlign: "left",
    fontWeight: "600",
  },
  whatsappTail: {
    position: "absolute",
    left: -10,
    top: 15,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 15,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  difficultyContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 0,
    marginBottom: 0,
  },
  instructionContainer: {
    paddingHorizontal: 20,
  },
  instructionText: {
    textAlign: "center",
  },
  inputContainer: {
    paddingHorizontal: 20,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  passButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
  },
  passButtonText: {
    fontWeight: "600",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionButtonText: {
    fontWeight: "600",
  },
});
