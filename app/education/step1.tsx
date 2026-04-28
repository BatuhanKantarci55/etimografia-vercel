import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import CompletionModal from "@components/Education/CompletionModal";
import ExitConfirmationModal from "@components/Education/ExitConfirmationModal";
import { useEducation } from "@contexts/EducationContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Image,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  darkOriginColors,
  lightOriginColors,
  originNamesTR,
} from "../../constants/OriginColors";

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

interface WordSelection {
  wordId: number;
  action: "known" | "learning";
}

export default function Step1Screen() {
  const { colors, themeMode } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { unitId = 1, stageId = 1 } = useLocalSearchParams();
  const {
    markWordsBatch,
    goToNextStep,
    getStepPoints,
    addEducationPoints,
    progress,
  } = useEducation();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [isCardOpened, setIsCardOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [selections, setSelections] = useState<WordSelection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ learning: 0, known: 0, total: 0 });
  const [points, setPoints] = useState({
    step1Points: 0,
    step2Points: 0,
    step3Points: 0,
    totalPoints: 0,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const leftButtonOpacity = useRef(new Animated.Value(0)).current;
  const rightButtonOpacity = useRef(new Animated.Value(0)).current;

  const wordsRef = useRef<Word[]>([]);

  const originColors =
    themeMode === "dark" ? darkOriginColors : lightOriginColors;

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  const leftButtonBackground = leftButtonOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(76, 175, 80, 0)", "rgba(76, 175, 80, 0.2)"],
  });

  const rightButtonBackground = rightButtonOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(33, 150, 243, 0)", "rgba(33, 150, 243, 0.2)"],
  });

  // Kelimeleri yükle
  useEffect(() => {
    const filteredWords = wordsData.filter(
      (word: Word) =>
        word.word_unit === Number(unitId) &&
        word.word_stage === Number(stageId),
    );

    // Kelimeleri karıştır
    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);

    setWords(shuffled);
    wordsRef.current = shuffled;

    setStats({
      learning: 0,
      known: 0,
      total: filteredWords.length,
    });

    // 1. adım puanını hesapla
    const stepPoints = getStepPoints(1);
    setPoints(stepPoints);

    setLoading(false);
  }, [unitId, stageId, getStepPoints]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    if (!completionVisible && !exitModalVisible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      rotateAnim.setValue(0);
      setIsCardOpened(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentWordIndex, completionVisible, exitModalVisible]);

  // Android geri butonu handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!completionVisible && !exitModalVisible) {
          setExitModalVisible(true);
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [completionVisible, exitModalVisible]);

  const openCard = () => {
    setIsCardOpened(true);
  };

  const goToNextWord = useCallback(() => {
    if (isProcessing) return;

    setIsProcessing(true);

    const currentWords = wordsRef.current;

    if (currentWordIndex < currentWords.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentWordIndex((prev) => prev + 1);
        setIsCardOpened(false);
        setTimeout(() => setIsProcessing(false), 300);
      });
    } else {
      setCompletionVisible(true);
      setIsProcessing(false);
    }
  }, [currentWordIndex, isProcessing, fadeAnim, slideAnim]);

  const currentWord = words[currentWordIndex];
  const hasMultipleEquivalents =
    (currentWord?.old_equivalents?.length ?? 0) > 1;
  const learningCount = selections.filter(
    (s) => s.action === "learning",
  ).length;
  const knownCount = selections.filter((s) => s.action === "known").length;

  const handleKnowWord = useCallback(() => {
    if (isProcessing || !currentWord) return;

    setSelections((prev) => [
      ...prev,
      { wordId: currentWord.id, action: "known" },
    ]);

    Animated.parallel([
      Animated.timing(leftButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rightButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    goToNextWord();
  }, [
    isProcessing,
    currentWord,
    leftButtonOpacity,
    rightButtonOpacity,
    goToNextWord,
  ]);

  const handleLearnStart = useCallback(() => {
    if (isProcessing || !currentWord) return;

    setSelections((prev) => [
      ...prev,
      { wordId: currentWord.id, action: "learning" },
    ]);

    Animated.parallel([
      Animated.timing(leftButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rightButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    goToNextWord();
  }, [
    isProcessing,
    currentWord,
    leftButtonOpacity,
    rightButtonOpacity,
    goToNextWord,
  ]);

  const handleComplete = async () => {
    console.log("📝 Seçimler kaydediliyor:", selections.length);
    await markWordsBatch(selections);

    const stepPoints = getStepPoints(1);
    console.log("💰 Hesaplanan puan:", stepPoints.totalPoints);

    await addEducationPoints(stepPoints.totalPoints);
    console.log("✅ Puan eklendi");

    await goToNextStep();
    console.log("✅ İlerleme güncellendi");

    setCompletionVisible(false);
    router.back();
  };

  const handleExit = () => {
    setExitModalVisible(false);
    router.back();
  };

  const handleExitCancel = () => {
    setExitModalVisible(false);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !completionVisible && !exitModalVisible,
    onMoveShouldSetPanResponder: (_, gesture) => {
      return (
        !completionVisible &&
        !exitModalVisible &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy * 2)
      );
    },
    onPanResponderMove: (_, gesture) => {
      if (!completionVisible && !exitModalVisible) {
        slideAnim.setValue(gesture.dx);
        const rotateValue = Math.max(-1, Math.min(1, gesture.dx / 200));
        rotateAnim.setValue(rotateValue);

        if (gesture.dx < 0) {
          leftButtonOpacity.setValue(Math.min(1, Math.abs(gesture.dx) / 150));
          rightButtonOpacity.setValue(0);
        } else if (gesture.dx > 0) {
          rightButtonOpacity.setValue(Math.min(1, gesture.dx / 150));
          leftButtonOpacity.setValue(0);
        }
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (!completionVisible && !exitModalVisible && !isProcessing) {
        Animated.parallel([
          Animated.timing(leftButtonOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(rightButtonOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();

        if (gesture.dx > 100) {
          handleLearnStart();
        } else if (gesture.dx < -100) {
          handleKnowWord();
        } else {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 5,
            }),
            Animated.spring(rotateAnim, {
              toValue: 0,
              useNativeDriver: true,
              friction: 5,
            }),
          ]).start();
        }
      }
    },
  });

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={[styles.container, styles.centerContent]}>
          <CustomText style={{ color: colors.text }}>Yükleniyor...</CustomText>
        </View>
      </BackgroundImage>
    );
  }

  if (completionVisible) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={[styles.container, styles.centerContent]}>
          <CompletionModal
            visible={completionVisible}
            onClose={handleComplete}
            step={1}
            stats={{
              learning: learningCount,
              known: knownCount,
              total: words.length,
            }}
            points={points}
            nextStep={2}
            unitId={Number(unitId)}
            stageId={Number(stageId)}
          />
        </View>
      </BackgroundImage>
    );
  }

  if (!currentWord) {
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
              styles.backButton,
              {
                backgroundColor: colors.primary,
                marginTop: scale(20),
                paddingHorizontal: scale(30),
                paddingVertical: scale(12),
                borderRadius: scale(25),
              },
            ]}
            onPress={() => router.back()}
          >
            <CustomText style={{ color: "white", fontSize: scale(16) }}>
              Geri Dön
            </CustomText>
          </TouchableOpacity>
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* DEĞİŞİKLİK: Masaüstünde üst boşluk (paddingTop) daha da azaltıldı */}
        <View
          style={[
            styles.header,
            { paddingTop: scale(isDesktop ? 5 : 50) },
            isDesktop && { paddingBottom: 0 },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                // DEĞİŞİKLİK: Masaüstünde geri butonu daha da küçültüldü (28 -> 24)
                width: scale(isDesktop ? 24 : 40),
                height: scale(isDesktop ? 24 : 40),
                borderRadius: scale(isDesktop ? 12 : 20),
              },
            ]}
            onPress={() => setExitModalVisible(true)}
          >
            <Ionicons
              name="arrow-back"
              // DEĞİŞİKLİK: Masaüstünde ikon boyutu küçültüldü (16 -> 14)
              size={scale(isDesktop ? 14 : 24)}
              color={colors.text}
            />
          </TouchableOpacity>
          <View
            style={[styles.progressContainer, { backgroundColor: colors.card }]}
          >
            <CustomText style={{ color: colors.text }}>
              {currentWordIndex + 1} / {words.length}
            </CustomText>
          </View>
        </View>

        {/* Kuş maskotu ve diyaloğu */}
        <View
          style={[
            styles.chatContainer,
            isDesktop && {
              maxWidth: scale(500),
              alignSelf: "center",
              width: "100%",
              marginBottom: 0, // DEĞİŞİKLİK: Alt boşluk sıfırlanıp kartla arası kapatıldı
            },
          ]}
        >
          <Image
            source={require("@assets/images/mascot/bird.png")}
            style={[
              styles.mascotImage,
              // DEĞİŞİKLİK: Masaüstünde kuşun üst boşluğu (margin) eksi değere çekilerek daha da yukarı taşındı (-15 -> -25)
              {
                width: scale(120),
                height: scale(120),
                marginTop: scale(isDesktop ? -5 : 50),
              },
            ]}
            resizeMode="contain"
          />
          <View
            style={[
              styles.bubbleWrapper,
              { marginTop: scale(isDesktop ? -25 : 40) },
            ]}
          >
            <View
              style={[
                styles.whatsappBubble,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <CustomText
                style={[
                  styles.bubbleText,
                  { color: colors.text, fontSize: scale(24) },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {currentWord.new_turkish_word}
              </CustomText>
            </View>
            <View
              style={[styles.whatsappTail, { borderRightColor: colors.card }]}
            />
          </View>
        </View>

        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ translateX: slideAnim }, { rotate }],
              opacity: fadeAnim,
            },
            // DEĞİŞİKLİK: Masaüstünde kart da kuşun altına (daha yukarıya) çekildi
            isDesktop && {
              maxWidth: scale(500),
              alignSelf: "center",
              width: "100%",
              marginTop: scale(-5),
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={openCard}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: scale(20),
                },
              ]}
            >
              {!isCardOpened ? (
                <View style={styles.closedCardContent}>
                  <Ionicons
                    name="eye"
                    size={scale(40)}
                    color={colors.primary}
                    style={styles.closedCardIcon}
                  />
                  <CustomText
                    style={[styles.hintText, { color: colors.text + "80" }]}
                  >
                    Görüntülemek için karta dokunun
                  </CustomText>
                </View>
              ) : (
                <View style={styles.openedCardContent}>
                  <View style={styles.oldTurkishContainer}>
                    <CustomText
                      style={[styles.oldTurkishWord, { color: colors.text }]}
                    >
                      {currentWord.old_turkish_word}
                    </CustomText>
                    <View
                      style={[
                        styles.originBox,
                        {
                          backgroundColor:
                            originColors[currentWord.old_turkish_origin] ||
                            colors.primary,
                        },
                      ]}
                    >
                      <CustomText style={styles.originBoxText}>
                        {originNamesTR[currentWord.old_turkish_origin] ||
                          currentWord.old_turkish_origin}
                      </CustomText>
                    </View>
                  </View>
                  <View style={styles.secondaryInfo}>
                    <View style={styles.infoSection}>
                      <CustomText
                        style={[
                          styles.infoLabel,
                          { color: colors.text + "60" },
                        ]}
                      >
                        TANIM
                      </CustomText>
                      <View
                        style={[
                          styles.definitionBox,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <CustomText
                          style={[
                            styles.definitionText,
                            { color: colors.text },
                          ]}
                        >
                          {currentWord.definition}
                        </CustomText>
                      </View>
                    </View>

                    {hasMultipleEquivalents && (
                      <View style={styles.infoSection}>
                        <CustomText
                          style={[
                            styles.infoLabel,
                            { color: colors.text + "60", textAlign: "center" },
                          ]}
                        >
                          DİĞER KARŞILIKLAR
                        </CustomText>
                        <View style={styles.equivalentsList}>
                          {currentWord.old_equivalents?.map((eq, index) => (
                            <View
                              key={index}
                              style={[
                                styles.equivalentChip,
                                { backgroundColor: colors.background },
                              ]}
                            >
                              <CustomText
                                style={[
                                  styles.equivalentText,
                                  { color: colors.text },
                                ]}
                              >
                                {eq}
                              </CustomText>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        <View
          style={[
            styles.bottomBarContainer,
            // Kart genişliğine uyum sağlaması için alt barlar masaüstünde merkeze hizalandı ve sınırlandırıldı
            isDesktop && {
              left: 0,
              right: 0,
              alignItems: "center",
              paddingHorizontal: 20,
            },
          ]}
        >
          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: colors.card,
                borderRadius: scale(30),
                borderWidth: 1,
                borderColor: colors.border,
              },
              isDesktop && { width: "100%", maxWidth: scale(500) },
            ]}
          >
            <Animated.View
              style={[
                styles.buttonContainer,
                { backgroundColor: leftButtonBackground },
              ]}
            >
              <TouchableOpacity
                style={[styles.barButton, styles.leftButton]}
                onPress={handleKnowWord}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={scale(24)}
                  color="#4CAF50"
                />
                <CustomText
                  style={[
                    styles.barButtonText,
                    { color: colors.text, fontSize: scale(14) },
                  ]}
                >
                  Kelimeyi Biliyorum
                </CustomText>
              </TouchableOpacity>
            </Animated.View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <Animated.View
              style={[
                styles.buttonContainer,
                { backgroundColor: rightButtonBackground },
              ]}
            >
              <TouchableOpacity
                style={[styles.barButton, styles.rightButton]}
                onPress={handleLearnStart}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                <Ionicons
                  name="school"
                  size={scale(24)}
                  color={colors.primary}
                />
                <CustomText
                  style={[
                    styles.barButtonText,
                    { color: colors.text, fontSize: scale(14) },
                  ]}
                >
                  Öğrenmeye Başla
                </CustomText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Çıkış Onay Modalı */}
        <ExitConfirmationModal
          visible={exitModalVisible}
          onConfirm={handleExit}
          onCancel={handleExitCancel}
        />
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: { justifyContent: "center", alignItems: "center" },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mascotImage: { borderRadius: 60 },
  bubbleWrapper: { flex: 1, position: "relative" },
  whatsappBubble: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderTopLeftRadius: 5,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  bubbleText: { textAlign: "left" },
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
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 140,
    alignSelf: "stretch",
  },
  card: { borderWidth: 1, padding: 20 },
  closedCardContent: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 150,
  },
  closedCardIcon: { marginBottom: 12 },
  hintText: { fontSize: 14, textAlign: "center" },
  openedCardContent: {},
  oldTurkishContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  oldTurkishWord: { fontSize: 30, flex: 1 },
  originBox: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginLeft: 12,
  },
  originBoxText: { color: "white", fontSize: 14 },
  secondaryInfo: { gap: 16 },
  infoSection: { marginBottom: 8 },
  infoLabel: { fontSize: 12, marginBottom: 6, letterSpacing: 0.5 },
  equivalentsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  equivalentChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  equivalentText: { fontSize: 14 },
  definitionBox: { padding: 14, borderRadius: 10 },
  definitionText: { fontSize: 14, lineHeight: 20 },
  bottomBarContainer: { position: "absolute", bottom: 60, left: 20, right: 20 },
  bottomBar: { flexDirection: "row", height: 65, overflow: "hidden" },
  buttonContainer: { flex: 1, borderRadius: 30 },
  barButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  leftButton: { borderTopLeftRadius: 30, borderBottomLeftRadius: 30 },
  rightButton: { borderTopRightRadius: 30, borderBottomRightRadius: 30 },
  barButtonText: { fontSize: 14 },
  divider: { width: 1, height: "55%", alignSelf: "center" },
  completionCard: {
    padding: 40,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    maxWidth: "80%",
  },
  completionTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  completionSubtitle: { textAlign: "center" },
  completionButton: { alignItems: "center", justifyContent: "center" },
});
