import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import OptionButton from "../common/OptionButton";

interface Word {
  id: number;
  old_turkish_word: string;
  new_turkish_word: string;
  definition: string;
  difficulty_level: number;
  old_equivalents?: string[];
}

interface DefinitionQuizProps {
  words: Word[];
  onProgress: (completed: number, total: number) => void;
  onComplete: () => void;
  onCorrect?: (wordId: number, difficulty: number) => void; // Yeni prop
}

export default function DefinitionQuiz({
  words,
  onProgress,
  onComplete,
  onCorrect,
}: DefinitionQuizProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  // Kuyruk yapısı: her kelime için bir nesne
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

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  useEffect(() => {
    console.log("📝 DefinitionQuiz başlatılıyor, kelime sayısı:", words.length);
    const initialQueue = words.map((word) => ({ word, wrongCount: 0 }));
    const shuffled = initialQueue.sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentItem(shuffled[0]);
  }, [words]);

  useEffect(() => {
    if (currentItem) {
      console.log(
        "🔄 Yeni kelime yükleniyor:",
        currentItem.word.old_turkish_word,
      );
      generateOptions();
      setSelectedOption(null);
      setShowResult(false);
      setNextButtonActive(false);
      isTransitioning.current = false;
    }
  }, [currentItem]);

  const generateOptions = useCallback(() => {
    if (!currentItem) return;

    const correctAnswer = currentItem.word.old_turkish_word;

    const otherWords = words
      .filter((w) => w.id !== currentItem.word.id)
      .map((w) => w.old_turkish_word);

    const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 3);

    const allOptions = [correctAnswer, ...wrongOptions];
    const shuffledOptions = [...allOptions].sort(() => Math.random() - 0.5);

    setOptions(shuffledOptions);
  }, [currentItem, words]);

  const handleOptionPress = (option: string) => {
    if (showResult || isTransitioning.current) return;

    console.log("👆 Şık seçildi:", option);
    setSelectedOption(option);
    const correct = option === currentItem?.word.old_turkish_word;
    console.log("✅ Doğru mu?", correct);
    setIsCorrect(correct);
    setShowResult(true);
    setNextButtonActive(true);

    if (correct && onCorrect && currentItem) {
      onCorrect(currentItem.word.id, currentItem.word.difficulty_level);
    }
  };

  const handleNext = () => {
    if (!nextButtonActive || !currentItem || isTransitioning.current) return;

    console.log(
      `⏩ İleri butonuna basıldı - mevcut kelime: ${currentItem.word.old_turkish_word}`,
    );
    isTransitioning.current = true;

    setShowResult(false);
    setSelectedOption(null);
    setNextButtonActive(false);

    if (isCorrect) {
      console.log(
        "✅ Doğru cevap, kelime kuyruktan çıkarılıyor:",
        currentItem.word.old_turkish_word,
      );
      const newQueue = queue.filter(
        (item) => item.word.id !== currentItem.word.id,
      );
      setQueue(newQueue);
      const newCompletedCount = completedCount + 1;
      setCompletedCount(newCompletedCount);
      onProgress(newCompletedCount, totalWords); // İlerlemeyi güncelle

      if (newQueue.length > 0) {
        console.log(
          "👉 Sonraki kelimeye geçiliyor, kalan kelime:",
          newQueue.length,
        );

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          console.log(
            "🎯 Yeni kelime set ediliyor:",
            newQueue[0].word.old_turkish_word,
          );
          setCurrentItem(newQueue[0]);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      } else {
        console.log("🏁 Tüm kelimeler bitti, onComplete çağrılıyor");
        onComplete();
      }
    } else {
      console.log(
        "❌ Yanlış cevap, kelime kuyruğun sonuna ekleniyor:",
        currentItem.word.old_turkish_word,
      );
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
        console.log(
          "🎯 Yeni kelime set ediliyor:",
          newQueue[0].word.old_turkish_word,
        );
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
          // DEĞİŞİKLİK: Masaüstünde kuş maskotunun üstten olan boşluğu kısılarak daha da yukarı taşındı
          { marginTop: scale(isDesktop ? -10 : 60), paddingLeft: scale(10) },
        ]}
      >
        <Image
          source={require("@assets/images/mascot/bird.png")}
          style={[
            styles.mascotImage,
            {
              width: scale(isDesktop ? 80 : 100),
              height: scale(isDesktop ? 80 : 100),
            },
          ]}
          resizeMode="contain"
        />
        <View style={[styles.bubbleWrapper, { marginLeft: scale(8), flex: 1 }]}>
          <View
            style={[
              styles.definitionBubble,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                width: "100%",
              },
              // DEĞİŞİKLİK: Kuşun yanındaki kutunun boyutu küçültüldü
              isDesktop && {
                paddingVertical: scale(8),
                paddingHorizontal: scale(12),
                minHeight: scale(40),
              },
            ]}
          >
            <CustomText
              style={[
                styles.definitionText,
                // DEĞİŞİKLİK: Masaüstünde kuşun yanındaki kelime boyutu daraltıldı (15 -> 11)
                { color: colors.text, fontSize: scale(isDesktop ? 11 : 15) },
              ]}
            >
              {currentItem.word.definition}
            </CustomText>
          </View>
          <View
            style={[styles.whatsappTail, { borderRightColor: colors.card }]}
          />
        </View>
      </View>

      <View
        style={[
          styles.instructionContainer,
          {
            marginTop: scale(isDesktop ? 10 : 30),
            marginBottom: scale(isDesktop ? 10 : 25),
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
          Bu tanıma ait eski Türkçe kelimeyi işaretleyiniz.
        </CustomText>
      </View>

      <View
        style={[
          styles.optionsContainer,
          { marginTop: scale(isDesktop ? 5 : 10) },
        ]}
      >
        <View style={styles.optionsRow}>
          {options.slice(0, 2).map((option, index) => (
            <View key={index} style={styles.optionWrapper}>
              <OptionButton
                label={option}
                onPress={() => handleOptionPress(option)}
                isSelected={selectedOption === option}
                isCorrect={option === currentItem.word.old_turkish_word}
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
                onPress={() => handleOptionPress(option)}
                isSelected={selectedOption === option}
                isCorrect={option === currentItem.word.old_turkish_word}
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
          styles.nextButtonContainer,
          { marginBottom: scale(isDesktop ? 10 : 30) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: nextButtonActive ? colors.primary : colors.card,
              borderColor: colors.border,
              opacity: nextButtonActive ? 1 : 0.5,
              // DEĞİŞİKLİK: Masaüstü ileri butonu kalınlığı (padding) daraltıldı
              paddingVertical: scale(isDesktop ? 10 : 14),
              borderRadius: scale(isDesktop ? 14 : 28),
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
                // DEĞİŞİKLİK: Masaüstü ileri butonu metin fontu daraltıldı
                fontSize: scale(isDesktop ? 13 : 16),
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
    paddingRight: 20,
  },
  mascotImage: {
    borderRadius: 50,
  },
  bubbleWrapper: {
    position: "relative",
    flex: 1,
  },
  definitionBubble: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderTopLeftRadius: 5,
    alignSelf: "stretch",
    minHeight: 80,
  },
  definitionText: {
    textAlign: "left",
    lineHeight: 22,
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
  nextButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
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
