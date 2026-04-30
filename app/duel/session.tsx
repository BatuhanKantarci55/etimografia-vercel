import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import DuelHeader from "@components/Duel/DuelHeader";
import DuelQuestionArea from "@components/Duel/DuelQuestionArea";
import DuelResultModal from "@components/Duel/DuelResultModal";
import PowerButton from "@components/Duel/PowerButton";
import Tower from "@components/Duel/Tower";
import { useAuth } from "@contexts/AuthContext";
import { useDuel } from "@contexts/DuelContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useSound } from "@hooks/useSound";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const wordsData = require("@assets/data/words.json");

interface Word {
  id: number;
  old_turkish_word: string;
  new_turkish_word: string;
  difficulty_level: number;
}

const GAME_DURATION = 120; // 2 dakika
const FILL_BAR_CAPACITY = 15;
const TOWER_PIECES_TO_WIN = 10;
const COUNTDOWN_DURATION = 3;

export default function DuelSessionScreen() {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { playSound } = useSound();
  const {
    activeSession,
    submitAnswer,
    usePower,
    endDuel,
    leaveDuel,
    clearActiveSession,
  } = useDuel();
  const { user } = useAuth();

  const [myWordPool, setMyWordPool] = useState<Word[]>([]);
  const [myWordIndex, setMyWordIndex] = useState(0);
  const [myAskedIds, setMyAskedIds] = useState<number[]>([]);
  const [myFillBar, setMyFillBar] = useState(0);
  const [myPowerCooldown, setMyPowerCooldown] = useState<Date | null>(null);
  const [passCount, setPassCount] = useState(3);
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_DURATION);
  const [gameStarted, setGameStarted] = useState(false);

  const [myPieces, setMyPieces] = useState(0);
  const [opponentPieces, setOpponentPieces] = useState(0);

  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [canAnswer, setCanAnswer] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isPlayer2, setIsPlayer2] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);

  // Sonuç ekranı verileri
  const [resultModalData, setResultModalData] = useState({
    myResult: "draw" as "win" | "loss" | "draw",
    myPieces: 0,
    opponentPieces: 0,
    myName: "",
    opponentName: "",
    myPoints: 0,
    opponentPoints: 0,
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const initialLoadDone = useRef(false);
  const isTransitioning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextWordRef = useRef<Word | null>(null);
  const nextIndexRef = useRef<number>(0);
  const gameStartTime = useRef<number | null>(null);
  const isEndingGame = useRef(false);

  const isPlayer1 = user?.id === activeSession?.player1_id;
  const myProfile = isPlayer1 ? activeSession?.player1 : activeSession?.player2;
  const opponentProfile = isPlayer1
    ? activeSession?.player2
    : activeSession?.player1;

  useEffect(() => {
    if (activeSession && !resultModalVisible) {
      setIsPlayer2(user?.id === activeSession.player2_id);
      const myCurrentPieces = isPlayer1
        ? activeSession.player1_tower_pieces
        : activeSession.player2_tower_pieces;
      const opponentCurrentPieces = isPlayer1
        ? activeSession.player2_tower_pieces
        : activeSession.player1_tower_pieces;
      setMyPieces(myCurrentPieces);
      setOpponentPieces(opponentCurrentPieces);
    }
  }, [activeSession, user, isPlayer1, resultModalVisible]);

  useEffect(() => {
    if (activeSession && !initialLoadDone.current && !sessionFinished) {
      const filtered = wordsData.filter((w: Word) => {
        if (activeSession.difficulty && activeSession.difficulty.length > 0) {
          return activeSession.difficulty.includes(w.difficulty_level);
        }
        return true;
      });

      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      setMyWordPool(shuffled);
      setMyWordIndex(0);
      setMyAskedIds([]);
      setMyFillBar(0);
      setPassCount(3);
      setGameEnded(false);
      setSessionFinished(false);
      isEndingGame.current = false;

      if (shuffled.length > 0) {
        setCurrentWord(shuffled[0]);
        generateOptions(shuffled[0]);
      }

      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [activeSession, sessionFinished]);

  useEffect(() => {
    if (!activeSession || gameEnded || sessionFinished) return;
    if (
      activeSession.status === "ongoing" &&
      !gameStarted &&
      !countdownVisible
    ) {
      setCountdownVisible(true);
      setCountdown(COUNTDOWN_DURATION);

      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      const startTime = Date.now();

      const updateCountdown = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
        setCountdown(remaining);

        if (remaining > 0) {
          countdownTimerRef.current = setTimeout(updateCountdown, 100);
        } else {
          setCountdownVisible(false);
          setGameStarted(true);
          setCanAnswer(true);
          gameStartTime.current = Date.now();

          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            if (gameStartTime.current) {
              const now = Date.now();
              const elapsed = Math.floor((now - gameStartTime.current) / 1000);
              const remaining = Math.max(0, GAME_DURATION - elapsed);
              setGameTimeLeft(remaining);
            }
          }, 1000);
        }
      };
      updateCountdown();
    }
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeSession?.status, gameEnded, sessionFinished]);

  // YEREL BİTİŞ KONTROLÜ
  useEffect(() => {
    if (!activeSession || gameEnded || sessionFinished) return;
    if (isEndingGame.current) return;

    if (
      myPieces >= TOWER_PIECES_TO_WIN ||
      opponentPieces >= TOWER_PIECES_TO_WIN ||
      gameTimeLeft <= 0
    ) {
      handleGameEnd();
    }
  }, [myPieces, opponentPieces, gameTimeLeft, gameEnded, sessionFinished]);

  // SUNUCU BİTİŞ KONTROLÜ: Rakip bitirdiyse
  useEffect(() => {
    if (!activeSession || gameEnded || sessionFinished) return;

    if (activeSession.status === "finished") {
      handleGameEnd();
    }
  }, [activeSession?.status, gameEnded, sessionFinished]);

  useEffect(() => {
    if (currentWord && gameStarted && !gameEnded && !sessionFinished) {
      setCanAnswer(true);
    }
  }, [currentWord, gameStarted, gameEnded, sessionFinished]);

  useEffect(() => {
    if (countdownVisible && countdown > 0) {
      Animated.sequence([
        Animated.timing(countdownAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(countdownAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [countdownVisible, countdown]);

  const generateOptions = (word: Word) => {
    if (!activeSession) return;
    const isOldToNew = activeSession.direction === "old-to-new";
    const correct = isOldToNew ? word.new_turkish_word : word.old_turkish_word;

    const otherWords = wordsData
      .filter((w: Word) => w.id !== word.id && !myAskedIds.includes(w.id))
      .map((w: Word) => (isOldToNew ? w.new_turkish_word : w.old_turkish_word));

    let wrongOptions;
    if (otherWords.length >= 3) {
      wrongOptions = [...otherWords]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    } else {
      const allOthers = wordsData
        .filter((w: Word) => w.id !== word.id)
        .map((w: Word) =>
          isOldToNew ? w.new_turkish_word : w.old_turkish_word,
        );
      wrongOptions = [...allOthers].sort(() => Math.random() - 0.5).slice(0, 3);
    }

    const all = [correct, ...wrongOptions];
    setOptions(all.sort(() => Math.random() - 0.5));
  };

  const moveToNextWord = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    const nextIndex = myWordIndex + 1;
    if (myWordPool.length > nextIndex) {
      let nextWordIndex = nextIndex;
      let nextWord = myWordPool[nextWordIndex];

      while (
        nextWord &&
        myAskedIds.includes(nextWord.id) &&
        nextWordIndex < myWordPool.length - 1
      ) {
        nextWordIndex++;
        nextWord = myWordPool[nextWordIndex];
      }

      if (nextWord && !myAskedIds.includes(nextWord.id)) {
        nextWordRef.current = nextWord;
        nextIndexRef.current = nextWordIndex;

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(() => {
          setCurrentWord(nextWordRef.current);
          setMyWordIndex(nextIndexRef.current);
          generateOptions(nextWordRef.current!);
          setCanAnswer(true);

          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.linear,
          }).start(() => {
            isTransitioning.current = false;
          });
        });
      } else {
        isTransitioning.current = false;
      }
    } else {
      isTransitioning.current = false;
    }
  };

  const handleAnswerSubmit = async (
    answer: string,
    wordId: number,
    difficulty: number,
  ) => {
    if (!activeSession) return;
    setCanAnswer(false);

    const isOldToNew = activeSession.direction === "old-to-new";
    const correct = isOldToNew
      ? currentWord?.new_turkish_word
      : currentWord?.old_turkish_word;
    const isCorrect = answer.toLowerCase() === correct?.toLowerCase();

    playSound(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      const newFill = myFillBar + difficulty;
      let newPieces = myPieces;
      let finalFill = newFill;

      while (
        finalFill >= FILL_BAR_CAPACITY &&
        newPieces < TOWER_PIECES_TO_WIN
      ) {
        finalFill -= FILL_BAR_CAPACITY;
        newPieces += 1;
      }
      if (finalFill > FILL_BAR_CAPACITY) finalFill = FILL_BAR_CAPACITY;

      if (newPieces > myPieces) {
        await submitAnswer(activeSession.id, true);
      }

      setMyFillBar(finalFill);
      setMyPieces(newPieces);
    } else {
      setMyFillBar(Math.max(0, myFillBar - 1));
    }
    setMyAskedIds((prev) => [...prev, wordId]);
  };

  const handlePass = () => {
    if (passCount > 0 && canAnswer && !isTransitioning.current) {
      setPassCount((p) => p - 1);
      setCanAnswer(false);
      moveToNextWord();
    }
  };

  const handleUsePower = async () => {
    if (
      !activeSession ||
      !canAnswer ||
      opponentPieces === 0 ||
      gameEnded ||
      sessionFinished
    )
      return;
    if (myPowerCooldown && new Date() < myPowerCooldown) return;

    const success = await usePower(activeSession.id);
    if (success) {
      playSound("complete");
      const cooldown = new Date();
      cooldown.setSeconds(cooldown.getSeconds() + 60);
      setMyPowerCooldown(cooldown);
      setOpponentPieces((prev) => Math.max(0, prev - 1));
    }
  };

  const handleGameEnd = async () => {
    if (gameEnded || !activeSession || sessionFinished) return;
    if (isEndingGame.current) return;

    isEndingGame.current = true;
    setGameEnded(true);
    setSessionFinished(true);
    setCanAnswer(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);

    // Bitişi gerçekleştir ve mutlak sonuçları getir
    const result = await endDuel(activeSession.id);

    let finalMyResult: "win" | "loss" | "draw" = "draw";
    if (result.actualWinnerId) {
      if (result.actualWinnerId === user?.id) finalMyResult = "win";
      else finalMyResult = "loss";
    }

    const myFinalPieces = isPlayer1
      ? result.actualPlayer1Pieces
      : result.actualPlayer2Pieces;
    const oppFinalPieces = isPlayer1
      ? result.actualPlayer2Pieces
      : result.actualPlayer1Pieces;

    const myFinalPoints = isPlayer1
      ? result.player1Points
      : result.player2Points;
    const oppFinalPoints = isPlayer1
      ? result.player2Points
      : result.player1Points;

    setMyPieces(myFinalPieces);
    setOpponentPieces(oppFinalPieces);

    setResultModalData({
      myResult: finalMyResult,
      myPieces: myFinalPieces,
      opponentPieces: oppFinalPieces,
      myName: myProfile?.username || "Ben",
      opponentName: opponentProfile?.username || "Rakip",
      myPoints: myFinalPoints,
      opponentPoints: oppFinalPoints,
    });

    setResultModalVisible(true);
  };

  const handleExitConfirm = async () => {
    if (activeSession) await leaveDuel(activeSession.id);
    setExitModalVisible(false);
    setSessionFinished(true);
    setGameEnded(true);
    isEndingGame.current = true;
    initialLoadDone.current = false;
    router.replace("/(tabs)");

    setTimeout(() => {
      clearActiveSession();
    }, 500);
  };

  const handleResultClose = () => {
    setResultModalVisible(false);
    setSessionFinished(true);
    setGameEnded(true);
    isEndingGame.current = true;
    initialLoadDone.current = false;
    router.replace("/(tabs)");

    setTimeout(() => {
      clearActiveSession();
    }, 500);
  };

  if (loading || !activeSession || !currentWord) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={[styles.container, styles.centerContent]}>
          <CustomText style={{ color: colors.text }}>Yükleniyor...</CustomText>
        </View>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        <DuelHeader
          timeLeft={gameTimeLeft}
          onExit={() => setExitModalVisible(true)}
        />

        <View style={styles.mainContent}>
          <Tower
            pieces={myPieces}
            fillBar={myFillBar}
            fillBarCapacity={FILL_BAR_CAPACITY}
            towerPiecesToWin={TOWER_PIECES_TO_WIN}
            color={colors.primary}
            label={myProfile?.username || "Ben"}
            showFillBar
          />
          <Tower
            pieces={opponentPieces}
            fillBar={0}
            fillBarCapacity={FILL_BAR_CAPACITY}
            towerPiecesToWin={TOWER_PIECES_TO_WIN}
            color="#F44336"
            label={opponentProfile?.username || "Rakip"}
            showFillBar={false}
          />
        </View>

        <Animated.View style={[styles.questionArea, { opacity: fadeAnim }]}>
          <DuelQuestionArea
            currentWord={currentWord}
            gameType={activeSession.game_type}
            direction={activeSession.direction}
            options={options}
            onSubmit={handleAnswerSubmit}
            onPass={handlePass}
            passCount={passCount}
            disabled={!canAnswer || gameEnded || sessionFinished}
            isGameOver={gameEnded || sessionFinished}
            onNext={moveToNextWord}
          />
        </Animated.View>

        <PowerButton
          onPress={handleUsePower}
          isActive={opponentPieces > 0}
          cooldownUntil={myPowerCooldown}
          disabled={!canAnswer || gameEnded || sessionFinished}
        />

        <Modal visible={countdownVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.countdownContainer,
                {
                  opacity: countdownAnim,
                  transform: [
                    {
                      scale: countdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <CustomText
                style={[
                  styles.countdownText,
                  { color: colors.primary, fontSize: scale(80) },
                ]}
              >
                {Math.ceil(countdown)}
              </CustomText>
              <CustomText
                style={[
                  styles.countdownLabel,
                  { color: colors.text, fontSize: scale(20) },
                ]}
              >
                HAZIR OLUN!
              </CustomText>
            </Animated.View>
          </View>
        </Modal>

        {/* Çıkış Uyarı Modalı */}
        <Modal
          visible={exitModalVisible}
          transparent
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
                  Düellodan Ayrıl
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
                Düellodan ayrılmak istediğinizden emin misiniz? Bu işlem yenilgi
                olarak sayılacaktır.
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
                  onPress={handleExitConfirm}
                >
                  <CustomText
                    style={[
                      styles.modalButtonText,
                      { color: "white", fontSize: scale(isDesktop ? 11 : 14) },
                    ]}
                  >
                    Ayrıl
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <DuelResultModal
          visible={resultModalVisible}
          myResult={resultModalData.myResult}
          myPieces={resultModalData.myPieces}
          opponentPieces={resultModalData.opponentPieces}
          myName={resultModalData.myName}
          opponentName={resultModalData.opponentName}
          myPoints={resultModalData.myPoints}
          opponentPoints={resultModalData.opponentPoints}
          onClose={handleResultClose}
        />
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: "center", alignItems: "center" },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  questionArea: { flex: 1, paddingHorizontal: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  modalMessage: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
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
  modalCancelButton: { borderWidth: 0 },
  modalConfirmButton: { borderWidth: 0 },
  modalButtonText: { fontSize: 16, fontWeight: "600" },
  countdownContainer: { alignItems: "center", justifyContent: "center" },
  countdownText: { fontWeight: "bold" },
  countdownLabel: { fontWeight: "600", marginTop: 10 },
});
