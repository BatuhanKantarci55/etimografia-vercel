import CustomText from "@components/CustomText";
import InputBox from "@components/Practice/InputBox";
import OptionButton from "@components/Practice/OptionButton";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

interface Word {
  id: number;
  old_turkish_word: string;
  new_turkish_word: string;
  difficulty_level: number;
}

interface Props {
  currentWord: Word;
  gameType: "multiple-choice" | "classic";
  direction: "old-to-new" | "new-to-old";
  options: string[];
  onSubmit: (answer: string, wordId: number, difficulty: number) => void;
  onPass: () => void;
  passCount: number;
  disabled: boolean;
  isGameOver?: boolean;
  onNext: () => void;
}

export default function DuelQuestionArea({
  currentWord,
  gameType,
  direction,
  options,
  onSubmit,
  onPass,
  passCount,
  disabled,
  isGameOver = false,
  onNext,
}: Props) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [buttonMode, setButtonMode] = useState<"check" | "next">("check");

  const handlersRef = useRef({
    handleOptionPress: (o: string) => {},
    handleClassicSubmit: () => {},
    onNext: () => {},
  });

  const isOldToNew = direction === "old-to-new";
  const questionWord = isOldToNew
    ? currentWord.old_turkish_word
    : currentWord.new_turkish_word;
  const correctAnswer = isOldToNew
    ? currentWord.new_turkish_word
    : currentWord.old_turkish_word;

  // Yeni kelime geldiğinde arayüzü sıfırla
  useEffect(() => {
    if (currentWord) {
      setInputValue("");
      setShowResult(false);
      setIsCorrect(false);
      setSelectedOption(null);
      setButtonMode("check");
    }
  }, [currentWord, direction]);

  const handleOptionPress = (opt: string) => {
    if (disabled || showResult) return;
    setSelectedOption(opt);
    setShowResult(true);
    setButtonMode("next");
    const correct = opt === correctAnswer;
    setIsCorrect(correct);
    onSubmit(opt, currentWord.id, currentWord.difficulty_level);
  };

  const handleClassicSubmit = () => {
    if (disabled || showResult || !inputValue.trim()) return;

    if (inputValue.trim().toLowerCase() === "pas" && passCount > 0) {
      onPass();
      setInputValue("");
      return;
    }

    setShowResult(true);
    setButtonMode("next");
    const correct =
      inputValue.trim().toLowerCase() === correctAnswer.toLowerCase();
    setIsCorrect(correct);
    onSubmit(inputValue, currentWord.id, currentWord.difficulty_level);
  };

  // Referansları hep güncel tut (klavye dinleyicisi için)
  useEffect(() => {
    handlersRef.current = { handleOptionPress, handleClassicSubmit, onNext };
  });

  // Web için klavye kısayollarını (1,2,4,5 ve Enter) dinle
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      if (showResult && e.key === "Enter") {
        handlersRef.current.onNext();
        return;
      }

      if (!showResult && !disabled) {
        if (gameType === "multiple-choice") {
          if (e.key === "4" && options[0])
            handlersRef.current.handleOptionPress(options[0]);
          if (e.key === "5" && options[1])
            handlersRef.current.handleOptionPress(options[1]);
          if (e.key === "1" && options[2])
            handlersRef.current.handleOptionPress(options[2]);
          if (e.key === "2" && options[3])
            handlersRef.current.handleOptionPress(options[3]);
        } else if (gameType === "classic") {
          if (e.key === "Enter") handlersRef.current.handleClassicSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResult, disabled, isGameOver, gameType, options]);

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name="star"
          size={scale(isDesktop ? 12 : 16)}
          color={
            i < currentWord.difficulty_level ? "#FFD700" : colors.text + "30"
          }
        />,
      );
    }
    return stars;
  };

  return (
    <View
      style={[
        styles.container,
        isDesktop && {
          maxWidth: scale(500),
          alignSelf: "center",
          width: "100%",
        },
      ]}
    >
      <View style={styles.questionContainer}>
        <View
          style={[
            styles.wordBubble,
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
              styles.wordText,
              { color: colors.text, fontSize: scale(isDesktop ? 14 : 24) },
            ]}
          >
            {questionWord}
          </CustomText>
        </View>
      </View>

      <View
        style={[
          styles.difficultyContainer,
          isDesktop && { marginBottom: scale(10) },
        ]}
      >
        {renderStars()}
      </View>

      <View style={styles.answerContainer}>
        {gameType === "multiple-choice" ? (
          <View
            style={[
              styles.optionsContainer,
              { marginTop: scale(isDesktop ? 0 : 10) },
            ]}
          >
            <View style={styles.optionsRow}>
              {options.slice(0, 2).map((opt, idx) => (
                <View key={idx} style={styles.optionWrapper}>
                  <OptionButton
                    label={opt}
                    shortcutKey={idx === 0 ? "4" : "5"}
                    onPress={() => handleOptionPress(opt)}
                    isSelected={selectedOption === opt}
                    isCorrect={opt === correctAnswer}
                    showResult={showResult}
                    disabled={disabled || showResult}
                    simpleMode={true}
                  />
                </View>
              ))}
            </View>
            <View style={styles.optionsRow}>
              {options.slice(2, 4).map((opt, idx) => (
                <View key={idx + 2} style={styles.optionWrapper}>
                  <OptionButton
                    label={opt}
                    shortcutKey={idx === 0 ? "1" : "2"}
                    onPress={() => handleOptionPress(opt)}
                    isSelected={selectedOption === opt}
                    isCorrect={opt === correctAnswer}
                    showResult={showResult}
                    disabled={disabled || showResult}
                    simpleMode={true}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.inputWrapper,
              { marginBottom: scale(isDesktop ? 10 : 20) },
            ]}
          >
            <InputBox
              value={inputValue}
              onChangeText={setInputValue}
              onSubmit={handleClassicSubmit}
              placeholder="Cevabınızı yazın veya 'pas' yazın..."
              disabled={disabled || showResult}
              showResult={showResult}
              isCorrect={isCorrect}
              autoFocus={!disabled}
            />
          </View>
        )}
      </View>

      {/* Alt kısım - Pas butonu ve İleri / Kontrol Et butonu */}
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
              opacity: passCount > 0 && !disabled && !showResult ? 1 : 0.5,
              paddingVertical: scale(isDesktop ? 8 : 12),
              paddingHorizontal: scale(isDesktop ? 12 : 16),
            },
          ]}
          onPress={onPass}
          disabled={passCount === 0 || disabled || showResult}
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
                gameType === "classic" &&
                buttonMode === "check" &&
                !inputValue.trim()
                  ? colors.card
                  : colors.primary,
              borderColor: colors.border,
              opacity:
                isGameOver ||
                (gameType === "classic" &&
                  buttonMode === "check" &&
                  !inputValue.trim()) ||
                (gameType === "multiple-choice" && !showResult)
                  ? 0.5
                  : 1,
              paddingVertical: scale(isDesktop ? 8 : 14),
              paddingHorizontal: scale(isDesktop ? 20 : 30),
              borderRadius: scale(28),
            },
          ]}
          onPress={() => {
            if (gameType === "classic" && buttonMode === "check") {
              handleClassicSubmit();
            } else if (showResult) {
              if (onNext) onNext();
            }
          }}
          disabled={
            isGameOver ||
            (gameType === "classic" &&
              buttonMode === "check" &&
              !inputValue.trim()) ||
            (gameType === "multiple-choice" && !showResult)
          }
          activeOpacity={0.8}
        >
          <CustomText
            style={[
              styles.actionButtonText,
              {
                color:
                  gameType === "classic" &&
                  buttonMode === "check" &&
                  !inputValue.trim()
                    ? colors.text + "80"
                    : "white",
                fontSize: scale(isDesktop ? 12 : 16),
              },
            ]}
          >
            {gameType === "classic" && buttonMode === "check"
              ? "Kontrol Et"
              : "İleri"}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  questionContainer: { alignItems: "center", marginBottom: 10 },
  wordBubble: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderTopLeftRadius: 5,
    maxWidth: "100%",
  },
  wordText: { textAlign: "center", fontWeight: "600" },
  difficultyContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginBottom: 20,
  },
  answerContainer: { flex: 1 },
  optionsContainer: { marginBottom: 20 },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optionWrapper: { width: "48%" },
  inputWrapper: { marginTop: 20 },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    marginTop: 10,
    marginBottom: 30,
  },
  passButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  passButtonText: { fontWeight: "600" },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionButtonText: { fontWeight: "600" },
});
