import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface Word {
  id: number;
  old_turkish_word: string;
  new_turkish_word: string;
  difficulty_level: number;
}

interface MatchingGameProps {
  words: Word[];
  onProgress: (completed: number, total: number) => void;
  onComplete: () => void;
  onCorrect?: (wordId: number, difficulty: number) => void; // Yeni prop
}

interface MatchItem {
  id: number;
  word: string;
  type: "old" | "new";
  pairedId?: number;
  difficulty: number;
}

export default function MatchingGame({
  words,
  onProgress,
  onComplete,
  onCorrect,
}: MatchingGameProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const [remainingWords, setRemainingWords] = useState<Word[]>([]);
  const [leftItems, setLeftItems] = useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchItem[]>([]);
  const [selectedLeftItem, setSelectedLeftItem] = useState<MatchItem | null>(
    null,
  );
  const [selectedRightItem, setSelectedRightItem] = useState<MatchItem | null>(
    null,
  );
  const [errorPair, setErrorPair] = useState<{
    leftId?: number;
    rightId?: number;
  }>({});
  const [completedPairs, setCompletedPairs] = useState<number[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalWords] = useState(words.length);

  const leftItemAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const rightItemAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    console.log("🎮 MatchingGame başlatılıyor, kelime sayısı:", words.length);
    if (words.length === 0) {
      console.log("⚠️ Kelime yok, onComplete çağrılıyor");
      onComplete();
      return;
    }

    setRemainingWords([...words]);
    setGameCompleted(false);
    setCompletedPairs([]);
    setCompletedCount(0);
    loadNextBatch([...words]);
  }, [words]);

  const loadNextBatch = (remaining: Word[]) => {
    const batch = remaining.slice(0, 6);
    console.log(
      `📦 Yeni batch yükleniyor: ${batch.length} kelime (kalan: ${remaining.length - batch.length})`,
    );

    if (batch.length === 0) {
      console.log("🏁 Tüm kelimeler eşleştirildi, oyun tamamlandı");
      setGameCompleted(true);
      setTimeout(() => {
        console.log("🎯 onComplete çağrılıyor");
        onComplete();
      }, 500);
      return;
    }

    const left: MatchItem[] = [];
    const right: MatchItem[] = [];

    batch.forEach((word) => {
      left.push({
        id: word.id,
        word: word.new_turkish_word,
        type: "new",
        difficulty: word.difficulty_level,
      });
      right.push({
        id: word.id,
        word: word.old_turkish_word,
        type: "old",
        difficulty: word.difficulty_level,
      });

      if (!leftItemAnims[`left-${word.id}`]) {
        leftItemAnims[`left-${word.id}`] = new Animated.Value(0);
      }
      if (!rightItemAnims[`right-${word.id}`]) {
        rightItemAnims[`right-${word.id}`] = new Animated.Value(0);
      }
    });

    const shuffledLeft = left.sort(() => Math.random() - 0.5);
    const shuffledRight = right.sort(() => Math.random() - 0.5);

    setLeftItems(shuffledLeft);
    setRightItems(shuffledRight);
    setRemainingWords(remaining.slice(batch.length));
    setSelectedLeftItem(null);
    setSelectedRightItem(null);
    setErrorPair({});
    setCompletedPairs([]);
  };

  const handleLeftItemPress = (item: MatchItem) => {
    if (completedPairs.includes(item.id) || gameCompleted) return;

    if (selectedLeftItem && selectedLeftItem.id !== item.id) {
      Animated.timing(leftItemAnims[`left-${selectedLeftItem.id}`], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    if (selectedLeftItem?.id === item.id) {
      Animated.timing(leftItemAnims[`left-${item.id}`], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      setSelectedLeftItem(null);
      return;
    }

    if (selectedRightItem) {
      checkMatch(item, selectedRightItem);
    } else {
      setSelectedLeftItem(item);
      setSelectedRightItem(null);

      Animated.timing(leftItemAnims[`left-${item.id}`], {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleRightItemPress = (item: MatchItem) => {
    if (completedPairs.includes(item.id) || gameCompleted) return;

    if (selectedRightItem && selectedRightItem.id !== item.id) {
      Animated.timing(rightItemAnims[`right-${selectedRightItem.id}`], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    if (selectedRightItem?.id === item.id) {
      Animated.timing(rightItemAnims[`right-${item.id}`], {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      setSelectedRightItem(null);
      return;
    }

    if (selectedLeftItem) {
      checkMatch(selectedLeftItem, item);
    } else {
      setSelectedRightItem(item);
      setSelectedLeftItem(null);

      Animated.timing(rightItemAnims[`right-${item.id}`], {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const checkMatch = (left: MatchItem, right: MatchItem) => {
    if (left.id === right.id) {
      if (onCorrect) {
        onCorrect(left.id, left.difficulty);
      }

      Animated.parallel([
        Animated.timing(leftItemAnims[`left-${left.id}`], {
          toValue: 2,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(rightItemAnims[`right-${right.id}`], {
          toValue: 2,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      setCompletedPairs([...completedPairs, left.id]);
      const newCompletedCount = completedCount + 1;
      setCompletedCount(newCompletedCount);
      onProgress(newCompletedCount, totalWords);
      setSelectedLeftItem(null);
      setSelectedRightItem(null);

      if (completedPairs.length + 1 === leftItems.length) {
        setTimeout(() => {
          if (remainingWords.length === 0) {
            setGameCompleted(true);
            setTimeout(() => {
              onComplete();
            }, 500);
          } else {
            loadNextBatch(remainingWords);
          }
        }, 800);
      }
    } else {
      const leftAnimValue = leftItemAnims[`left-${left.id}`];
      const rightAnimValue = rightItemAnims[`right-${right.id}`];

      const createBlinkAnimation = (
        animValue: Animated.Value,
        targetValue: number,
      ) => {
        return Animated.sequence([
          Animated.timing(animValue, {
            toValue: 3,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: targetValue,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 3,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: targetValue,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 3,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
        ]);
      };

      Animated.parallel([
        createBlinkAnimation(leftAnimValue, 1),
        createBlinkAnimation(rightAnimValue, 1),
      ]).start(() => {
        setSelectedLeftItem(null);
        setSelectedRightItem(null);
        setErrorPair({});
      });

      setErrorPair({ leftId: left.id, rightId: right.id });
    }
  };

  const getLeftItemStyle = (item: MatchItem) => {
    const animValue = leftItemAnims[`left-${item.id}`] || new Animated.Value(0);

    if (completedPairs.includes(item.id)) {
      return {
        backgroundColor: animValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [colors.card, colors.primary, "#4CAF50"],
        }),
      };
    }

    return {
      backgroundColor: animValue.interpolate({
        inputRange: [0, 1, 3],
        outputRange: [colors.card, colors.primary, "#F44336"],
      }),
    };
  };

  const getRightItemStyle = (item: MatchItem) => {
    const animValue =
      rightItemAnims[`right-${item.id}`] || new Animated.Value(0);

    if (completedPairs.includes(item.id)) {
      return {
        backgroundColor: animValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [colors.card, colors.primary, "#4CAF50"],
        }),
      };
    }

    return {
      backgroundColor: animValue.interpolate({
        inputRange: [0, 1, 3],
        outputRange: [colors.card, colors.primary, "#F44336"],
      }),
    };
  };

  const getLeftTextColor = (item: MatchItem) => {
    if (completedPairs.includes(item.id)) return "white";

    const animValue = leftItemAnims[`left-${item.id}`] || new Animated.Value(0);
    const selectedValue = animValue as any;
    const currentValue = selectedValue.__getValue
      ? selectedValue.__getValue()
      : 0;

    if (currentValue > 0) {
      return "white";
    }
    return colors.text;
  };

  const getRightTextColor = (item: MatchItem) => {
    if (completedPairs.includes(item.id)) return "white";

    const animValue =
      rightItemAnims[`right-${item.id}`] || new Animated.Value(0);
    const selectedValue = animValue as any;
    const currentValue = selectedValue.__getValue
      ? selectedValue.__getValue()
      : 0;

    if (currentValue > 0) {
      return "white";
    }
    return colors.text;
  };

  if (gameCompleted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <CustomText style={{ color: colors.text }}>
          Eşleştirme tamamlandı, yönlendiriliyor...
        </CustomText>
      </View>
    );
  }

  if (leftItems.length === 0 || rightItems.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <CustomText style={{ color: colors.text }}>Yükleniyor...</CustomText>
      </View>
    );
  }

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
      <View
        style={[
          styles.instructionContainer,
          {
            marginTop: scale(isDesktop ? 10 : 30),
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
          Soldaki yeni Türkçe kelimeleri sağdaki eski Türkçe karşılıklarıyla
          eşleştirin.
        </CustomText>
      </View>

      <View style={[styles.headersContainer, isDesktop && { marginBottom: 5 }]}>
        <View
          style={[
            styles.headerBox,
            { width: "48%", backgroundColor: colors.primary + "20" },
          ]}
        >
          <CustomText
            style={[
              styles.headerText,
              { color: colors.primary, fontSize: scale(14) },
            ]}
          >
            Yeni Türkçe
          </CustomText>
        </View>
        <View
          style={[
            styles.headerBox,
            { width: "48%", backgroundColor: colors.primary + "20" },
          ]}
        >
          <CustomText
            style={[
              styles.headerText,
              { color: colors.primary, fontSize: scale(14) },
            ]}
          >
            Eski Türkçe
          </CustomText>
        </View>
      </View>

      <View
        style={[
          styles.matchingContainer,
          { marginTop: scale(isDesktop ? 5 : 20) },
        ]}
      >
        {/* Sol Taraf - Yeni Türkçe */}
        <View style={styles.column}>
          {leftItems.map((item, index) => {
            const isDisabled =
              completedPairs.includes(item.id) || gameCompleted;
            const itemStyle = getLeftItemStyle(item);

            return (
              <Animated.View
                key={`left-${item.id}-${index}`}
                style={[
                  styles.item,
                  {
                    width: "100%",
                    marginBottom: scale(isDesktop ? 4 : 12),
                    borderRadius: scale(isDesktop ? 6 : 10),
                    backgroundColor: itemStyle.backgroundColor,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.touchable,
                    {
                      // DEĞİŞİKLİK: Masaüstü için padding dikey ve yatay daraltıldı
                      paddingVertical: scale(isDesktop ? 8 : 20),
                      paddingHorizontal: scale(isDesktop ? 6 : 14),
                    },
                  ]}
                  onPress={() => handleLeftItemPress(item)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <CustomText
                    style={[
                      styles.itemText,
                      {
                        color: getLeftTextColor(item),
                        // DEĞİŞİKLİK: Masaüstü için font boyutu daraltıldı (13 -> 11)
                        fontSize: scale(isDesktop ? 11 : 15),
                        fontWeight: completedPairs.includes(item.id)
                          ? "600"
                          : "400",
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {item.word}
                  </CustomText>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Sağ Taraf - Eski Türkçe */}
        <View style={styles.column}>
          {rightItems.map((item, index) => {
            const isDisabled =
              completedPairs.includes(item.id) || gameCompleted;
            const itemStyle = getRightItemStyle(item);

            return (
              <Animated.View
                key={`right-${item.id}-${index}`}
                style={[
                  styles.item,
                  {
                    width: "100%",
                    marginBottom: scale(isDesktop ? 4 : 12),
                    borderRadius: scale(isDesktop ? 6 : 10),
                    backgroundColor: itemStyle.backgroundColor,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.touchable,
                    {
                      // DEĞİŞİKLİK: Masaüstü için padding dikey ve yatay daraltıldı
                      paddingVertical: scale(isDesktop ? 8 : 20),
                      paddingHorizontal: scale(isDesktop ? 6 : 14),
                    },
                  ]}
                  onPress={() => handleRightItemPress(item)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <CustomText
                    style={[
                      styles.itemText,
                      {
                        color: getRightTextColor(item),
                        // DEĞİŞİKLİK: Masaüstü için font boyutu daraltıldı (13 -> 11)
                        fontSize: scale(isDesktop ? 11 : 15),
                        fontWeight: completedPairs.includes(item.id)
                          ? "600"
                          : "400",
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {item.word}
                  </CustomText>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
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
  instructionContainer: {
    paddingHorizontal: 20,
  },
  instructionText: {
    textAlign: "center",
  },
  headersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerBox: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  headerText: {
    fontWeight: "600",
  },
  matchingContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  column: {
    width: "48%",
  },
  item: {
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  touchable: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    textAlign: "center",
  },
});
