import CustomText from "@components/CustomText";
import AnimatedBird from "@components/Practice/AnimatedBird";
import OptionButton from "@components/Practice/OptionButton";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useSound } from "@hooks/useSound";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
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

interface MultipleChoiceProps {
  words: Word[];
  onProgress: (
    completed: number,
    total: number,
    points?: number,
    isCorrect?: boolean,
  ) => void;
  onComplete: () => void;
  direction: "old-to-new" | "new-to-old";
  onPointsEarned?: (points: number) => void;
  onMistake?: (wordId: number, wordText: string) => void;
  onComboChange?: (isComboActive: boolean, progress: number) => void;
  onTimeAdded?: (seconds: number) => void;
  passCount?: number;
  onPass?: () => void;
}

export default function MultipleChoice({
  words,
  onProgress,
  onComplete,
  direction,
  onPointsEarned,
  onMistake,
  onComboChange,
  onTimeAdded,
  passCount = 3,
  onPass,
}: MultipleChoiceProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { playSound } = useSound();

  const [queue, setQueue] = useState<{ word: Word; wrongCount: number }[]>([]);
  const [currentItem, setCurrentItem] = useState<{
    word: Word;
    wrongCount: number;
  } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalWords] = useState(words.length);
  const [nextButtonActive, setNextButtonActive] = useState(false);
  const [birdAnimation, setBirdAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<"correct" | "wrong">(
    "correct",
  );
  const [comboCount, setComboCount] = useState(0);
  const [isComboActive, setIsComboActive] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  // DEĞİŞİKLİK: React Hook state'lerini dinleyebilmek için klavye olaylarında kullanılacak olan ref
  const handlersRef = useRef({
    handleOptionPress: (o: string) => {},
    handleNext: () => {},
  });

  useEffect(() => {
    handlersRef.current = { handleOptionPress, handleNext };
  });

  // DEĞİŞİKLİK: Web üzerinde klavye kısayollarını (1, 2, 4, 5 ve Enter) dinleyen yapı eklendi
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter tuşu ile sonraki soruya geçiş
      if (
        showResult &&
        nextButtonActive &&
        !isTransitioning.current &&
        e.key === "Enter"
      ) {
        handlersRef.current.handleNext();
        return;
      }

      // Kutu kapalıysa numpad tuşlarıyla seçim (Sol Üst: 4, Sağ Üst: 5, Sol Alt: 1, Sağ Alt: 2)
      if (!showResult && !isTransitioning.current) {
        if (e.key === "4" && options[0])
          handlersRef.current.handleOptionPress(options[0]);
        if (e.key === "5" && options[1])
          handlersRef.current.handleOptionPress(options[1]);
        if (e.key === "1" && options[2])
          handlersRef.current.handleOptionPress(options[2]);
        if (e.key === "2" && options[3])
          handlersRef.current.handleOptionPress(options[3]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResult, nextButtonActive, options]);

  useEffect(() => {
    const initialQueue = words.map((word) => ({ word, wrongCount: 0 }));
    const shuffled = initialQueue.sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentItem(shuffled[0]);
  }, [words]);

  useEffect(() => {
    if (currentItem) {
      generateOptions();
      setSelectedOption(null);
      setShowResult(false);
      setNextButtonActive(false);
      setIsCorrect(false);
      isTransitioning.current = false;
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

  const generateOptions = useCallback(() => {
    if (!currentItem) return;

    const isOldToNew = direction === "old-to-new";
    const correctAnswer = isOldToNew
      ? currentItem.word.new_turkish_word
      : currentItem.word.old_turkish_word;

    const otherWords = words
      .filter((w) => w.id !== currentItem.word.id)
      .map((w) => (isOldToNew ? w.new_turkish_word : w.old_turkish_word));

    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 3);

    const allOptions = [correctAnswer, ...wrongOptions];
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);

    setOptions(shuffledOptions);
  }, [currentItem, words, direction]);

  const handleOptionPress = (option: string) => {
    if (showResult || isTransitioning.current) return;
    if (!currentItem) return;

    const isOldToNew = direction === "old-to-new";
    const correctAnswer = isOldToNew
      ? currentItem.word.new_turkish_word
      : currentItem.word.old_turkish_word;

    const correct = option === correctAnswer;

    setIsCorrect(correct);
    setSelectedOption(option);
    setShowResult(true);
    setNextButtonActive(true);

    if (correct) {
      playSound("correct");
      setAnimationType("correct");

      let points = currentItem.word.difficulty_level || 1;

      if (isComboActive) {
        points *= 2;
      }

      onPointsEarned?.(points);

      const newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);

      if (newCorrectCount % 2 === 0) {
        onTimeAdded?.(1);
      }

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

      if (onMistake) {
        onMistake(currentItem.word.id, currentItem.word.old_turkish_word);
      }

      const penaltyPoints = -1;
      onPointsEarned?.(penaltyPoints);
      onProgress(completedCount, totalWords, penaltyPoints, false);
    }

    setBirdAnimation(true);
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

  const handleBirdAnimationComplete = () => {
    setBirdAnimation(false);
  };

  const handleNext = () => {
    if (!nextButtonActive || !currentItem || isTransitioning.current) return;

    isTransitioning.current = true;

    setShowResult(false);
    setSelectedOption(null);
    setNextButtonActive(false);

    if (isCorrect) {
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

  if (!currentItem) {
    return (
      <View style={styles.container}>
        <CustomText style={{ color: colors.text }}>Yükleniyor...</CustomText>
      </View>
    );
  }

  const isOldToNew = direction === "old-to-new";
  const questionWord = isOldToNew
    ? currentItem.word.old_turkish_word
    : currentItem.word.new_turkish_word;
  const correctAnswer = isOldToNew
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
          { marginTop: scale(isDesktop ? 80 : 40) },
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
        <View style={[styles.bubbleWrapper, { marginLeft: scale(-12) }]}>
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
          Verilen eski Türkçe sözcüğün yeni Türkçesini işaretleyiniz.
        </CustomText>
      </View>

      <View
        style={[
          styles.optionsContainer,
          { marginTop: scale(isDesktop ? 0 : 10) },
        ]}
      >
        <View style={styles.optionsRow}>
          {options.slice(0, 2).map((option, index) => (
            <View key={index} style={styles.optionWrapper}>
              <OptionButton
                label={option}
                shortcutKey={index === 0 ? "4" : "5"} // DEĞİŞİKLİK: Üst sıradaki butonlar için kısayollar 4 ve 5
                onPress={() => handleOptionPress(option)}
                isSelected={selectedOption === option}
                isCorrect={option === correctAnswer}
                showResult={showResult}
                disabled={showResult || isTransitioning.current}
                simpleMode={true}
              />
            </View>
          ))}
        </View>
        <View style={styles.optionsRow}>
          {options.slice(2, 4).map((option, index) => (
            <View key={index + 2} style={styles.optionWrapper}>
              <OptionButton
                label={option}
                shortcutKey={index === 0 ? "1" : "2"} // DEĞİŞİKLİK: Alt sıradaki butonlar için kısayollar 1 ve 2
                onPress={() => handleOptionPress(option)}
                isSelected={selectedOption === option}
                isCorrect={option === correctAnswer}
                showResult={showResult}
                disabled={showResult || isTransitioning.current}
                simpleMode={true}
              />
            </View>
          ))}
        </View>
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
            styles.nextButton,
            {
              backgroundColor: nextButtonActive ? colors.primary : colors.card,
              borderColor: colors.border,
              opacity: nextButtonActive && !isTransitioning.current ? 1 : 0.5,
              paddingVertical: scale(isDesktop ? 8 : 14),
              paddingHorizontal: scale(isDesktop ? 20 : 30),
              borderRadius: scale(28),
            },
          ]}
          onPress={handleNext}
          disabled={!nextButtonActive || isTransitioning.current}
          activeOpacity={0.8}
        >
          <CustomText
            style={[
              styles.nextButtonText,
              {
                color: nextButtonActive ? "white" : colors.text + "80",
                fontSize: scale(isDesktop ? 12 : 16),
              },
            ]}
          >
            İleri
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
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optionWrapper: {
    width: "48%",
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
  nextButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  nextButtonText: {
    fontWeight: "600",
  },
});
