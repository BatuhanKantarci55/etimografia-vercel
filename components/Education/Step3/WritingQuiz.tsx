import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { useSound } from "@hooks/useSound";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedBird from "../common/AnimatedBird";
import InputBox from "./InputBox";

interface Word {
  id: number;
  old_turkish_word: string;
  new_turkish_word: string;
  difficulty_level: number;
}

interface WritingQuizProps {
  words: Word[];
  onProgress: (completed: number, total: number) => void;
  onComplete: () => void;
  onTimeAdded: (seconds: number) => void;
  onCorrect?: (wordId: number, difficulty: number) => void; // Yeni prop
}

// Levenshtein distance hesaplama
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

// Yan yana iki harfin yer değiştirip değiştirmediğini kontrol et
const hasAdjacentTransposition = (
  userWord: string,
  correctWord: string,
): boolean => {
  if (userWord.length !== correctWord.length) return false;

  let diffCount = 0;
  let firstDiffIndex = -1;

  // Farklı olan harfleri bul
  for (let i = 0; i < userWord.length; i++) {
    if (userWord[i] !== correctWord[i]) {
      diffCount++;
      if (firstDiffIndex === -1) {
        firstDiffIndex = i;
      }
    }
  }

  // Sadece iki fark varsa ve bunlar yan yana ise
  if (
    diffCount === 2 &&
    firstDiffIndex !== -1 &&
    firstDiffIndex + 1 < userWord.length
  ) {
    // İkinci farkın indeksi birinci farkın hemen yanında olmalı
    if (userWord[firstDiffIndex] !== correctWord[firstDiffIndex + 1]) {
      return false;
    }
    if (userWord[firstDiffIndex + 1] !== correctWord[firstDiffIndex]) {
      return false;
    }

    // Kalan tüm harfler aynı olmalı
    for (let i = 0; i < userWord.length; i++) {
      if (i !== firstDiffIndex && i !== firstDiffIndex + 1) {
        if (userWord[i] !== correctWord[i]) {
          return false;
        }
      }
    }

    console.log(
      `🔄 Yan yana harfler yer değiştirmiş: ${userWord[firstDiffIndex]}${userWord[firstDiffIndex + 1]} -> ${correctWord[firstDiffIndex]}${correctWord[firstDiffIndex + 1]}`,
    );
    return true;
  }

  return false;
};

export default function WritingQuiz({
  words,
  onProgress,
  onComplete,
  onTimeAdded,
  onCorrect,
}: WritingQuizProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
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

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {});

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    console.log("📝 WritingQuiz başlatılıyor, kelime sayısı:", words.length);
    const initialQueue = words.map((word) => ({ word, wrongCount: 0 }));
    const shuffled = initialQueue.sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentItem(shuffled[0]);
  }, [words]);

  useEffect(() => {
    if (currentItem) {
      console.log(
        "🔄 Yeni kelime yükleniyor:",
        currentItem.word.new_turkish_word,
      );
      setInputValue("");
      setShowResult(false);
      setIsExactMatch(false);
      setIsCloseMatch(false);
      setButtonMode("check");
      isTransitioning.current = false;
      setInputKey((prev) => prev + 1);
    }
  }, [currentItem]);

  const checkAnswer = (userAnswer: string, correctAnswer: string) => {
    const user = userAnswer.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();

    console.log("🔍 Kullanıcı cevabı:", user);
    console.log("✅ Doğru cevap:", correct);
    console.log(
      "📏 Uzunluklar - Kullanıcı:",
      user.length,
      "Doğru:",
      correct.length,
    );

    // Uzunluk farkı kontrolü
    if (user.length !== correct.length) {
      console.log(`❌ Uzunluk farkı var -> YANLIŞ`);
      return { exactMatch: false, closeMatch: false };
    }

    // Birebir eşleşme
    if (user === correct) {
      console.log(`✅ Birebir eşleşme -> DOĞRU`);
      return { exactMatch: true, closeMatch: false };
    }

    // Yan yana harflerin yer değiştirmesi kontrolü
    if (hasAdjacentTransposition(user, correct)) {
      console.log(`🔄 Yan yana harfler yer değiştirmiş -> YAKIN EŞLEŞME`);
      return { exactMatch: false, closeMatch: true };
    }

    // Levenshtein distance ile tek harf hatası kontrolü
    const distance = levenshteinDistance(user, correct);
    console.log(`📏 Levenshtein distance: ${distance}`);

    if (distance === 1) {
      console.log(`🔤 Tek harf hatası -> YAKIN EŞLEŞME`);
      return { exactMatch: false, closeMatch: true };
    }

    console.log(`❌ Tamamen yanlış -> YANLIŞ`);
    return { exactMatch: false, closeMatch: false };
  };

  const handleCheck = () => {
    if (showResult || isTransitioning.current || !currentItem) return;

    if (!inputValue.trim()) {
      return;
    }

    console.log("🔍 Kontrol ediliyor:", inputValue);

    const result = checkAnswer(inputValue, currentItem.word.old_turkish_word);
    console.log("📊 Sonuç:", result);

    setIsExactMatch(result.exactMatch);
    setIsCloseMatch(result.closeMatch);
    setShowResult(true);
    setButtonMode("next");

    // Ses çal
    if (result.exactMatch || result.closeMatch) {
      playSound("correct");
      setAnimationType("correct");

      // Doğru cevapta süre ekle (+1 saniye)
      onTimeAdded(1);

      // Doğru cevap sayısını bildir
      if (onCorrect && currentItem && result.exactMatch) {
        onCorrect(currentItem.word.id, currentItem.word.difficulty_level);
      }

      // İlerleme barını güncelle
      const newCompletedCount = completedCount + 1;
      setCompletedCount(newCompletedCount);
      onProgress(newCompletedCount, totalWords);
    } else {
      playSound("wrong");
      setAnimationType("wrong");
    }

    setBirdAnimation(true);
    Keyboard.dismiss();
  };

  const handleNext = () => {
    if (!currentItem || isTransitioning.current) return;

    console.log(
      `⏩ İleri butonuna basıldı - mevcut kelime: ${currentItem.word.new_turkish_word}`,
    );
    isTransitioning.current = true;

    if (isExactMatch || isCloseMatch) {
      console.log(
        "✅ Doğru cevap, kelime kuyruktan çıkarılıyor:",
        currentItem.word.old_turkish_word,
      );
      const newQueue = queue.filter(
        (item) => item.word.id !== currentItem.word.id,
      );
      setQueue(newQueue);

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
            newQueue[0].word.new_turkish_word,
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
          newQueue[0].word.new_turkish_word,
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

  const handleBirdAnimationComplete = () => {
    console.log("🐦 Kuş animasyonu tamamlandı");
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

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim },
        // DEĞİŞİKLİK: Masaüstünde içerik yatayda daraltıldı ve ortalandı
        isDesktop && {
          maxWidth: scale(500),
          alignSelf: "center",
          width: "100%",
        },
      ]}
    >
      {/* DEĞİŞİKLİK: Kuş Maskotu dikey boşlukları (margin) kısılarak daha da yukarı çekildi */}
      <View
        style={[
          styles.mascotContainer,
          { marginTop: scale(isDesktop ? 10 : 60) },
        ]}
      >
        <AnimatedBird
          // DEĞİŞİKLİK: Kuş animasyonu boyutu küçültüldü (140 -> 100)
          size={isDesktop ? 100 : 140}
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
            ]}
          >
            <CustomText
              style={[
                styles.bubbleText,
                // DEĞİŞİKLİK: Masaüstü için kelime fontu küçültüldü (24 -> 16)
                { color: colors.text, fontSize: scale(isDesktop ? 16 : 24) },
              ]}
            >
              {currentItem.word.new_turkish_word}
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
          // DEĞİŞİKLİK: Talimat yazısı boşlukları daraltılarak yukarıya itildi
          {
            marginTop: scale(isDesktop ? 10 : 30),
            marginBottom: scale(isDesktop ? 10 : 40),
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
          Bu kelimenin eski Türkçe karşılığını yazınız.
        </CustomText>
      </View>

      {/* Input Alanı (Parent maxWidth sınırlaması sayesinde bu da otomatik olarak daralacak) */}
      <View
        style={[
          styles.inputContainer,
          // DEĞİŞİKLİK: Input ile altındaki butonun arasındaki mesafe daraltıldı
          { marginBottom: scale(isDesktop ? 10 : 20) },
        ]}
      >
        <InputBox
          key={inputKey}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmit={handleSubmit}
          placeholder="Eski Türkçe karşılığını yazın..."
          disabled={showResult}
          showResult={showResult}
          isCorrect={isExactMatch}
          isCloseMatch={isCloseMatch}
          correctAnswer={
            !isExactMatch && showResult
              ? currentItem.word.old_turkish_word
              : undefined
          }
          autoFocus={true}
        />
      </View>

      <View style={styles.buttonContainer}>
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
              opacity: buttonMode === "check" && !isCheckButtonActive ? 0.5 : 1,
              // DEĞİŞİKLİK: Input kutusuyla BİREBİR aynı boyutlara sahip olması için padding ve radius eşitlendi
              paddingVertical: scale(isDesktop ? 10 : 16),
              borderRadius: scale(isDesktop ? 8 : 28),
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
                // DEĞİŞİKLİK: Input kutusuyla BİREBİR aynı boyutlara sahip olması için yazı boyutu eşitlendi
                fontSize: scale(isDesktop ? 13 : 18),
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
  instructionContainer: {
    paddingHorizontal: 20,
  },
  instructionText: {
    textAlign: "center",
  },
  inputContainer: {
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
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
