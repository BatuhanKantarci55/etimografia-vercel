import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { originColors, originNamesTR } from "constants/OriginColors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SortDirection, SortField, Word } from "../../types/dictionary";

// DEĞİŞİKLİK: Android için Layout animasyonunu aktif ediyoruz
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WordListItemProps {
  word: Word;
  index: number;
  onBookmarkToggle: (id: number) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onDetailToggle?: (wordId: number | null) => void;
  isDetailOpen?: boolean;
}

export default function WordListItem({
  word,
  index,
  onBookmarkToggle,
  sortField,
  sortDirection,
  onDetailToggle,
  isDetailOpen = false,
}: WordListItemProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive(); // DEĞİŞİKLİK: isDesktop eklendi

  // Animasyon Değerleri
  const heightAnimation = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const bookmarkScaleAnim = useRef(
    new Animated.Value(word.isSaved ? 1 : 0),
  ).current;

  // Web için dinamik yükseklik ölçümü
  const [contentHeight, setContentHeight] = useState(0);

  const toggleDetail = () => {
    if (onDetailToggle) {
      if (Platform.OS !== "web") {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      onDetailToggle(isDetailOpen ? null : word.id);
    }
  };

  // Web Platformu İçin Yumuşak Açılır-Kapanır Animasyon
  useEffect(() => {
    if (Platform.OS === "web") {
      if (isDetailOpen && contentHeight > 0) {
        Animated.parallel([
          Animated.timing(heightAnimation, {
            toValue: contentHeight,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 200,
            delay: 100,
            useNativeDriver: false,
          }),
        ]).start();
      } else if (!isDetailOpen) {
        Animated.parallel([
          Animated.timing(heightAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(contentOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  }, [isDetailOpen, contentHeight]);

  // Kaydedilenler ikonunun pop-up animasyonu
  useEffect(() => {
    Animated.timing(bookmarkScaleAnim, {
      toValue: word.isSaved ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [word.isSaved]);

  const bookmarkScale = bookmarkScaleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.3, 1],
  });

  const onLayout = useCallback(
    (event: any) => {
      if (Platform.OS === "web") {
        const height = event.nativeEvent.layout.height;
        if (height !== contentHeight && height > 0) {
          setContentHeight(height);
        }
      }
    },
    [contentHeight],
  );

  // DEĞİŞİKLİK: Koyu renkli satırların rengi biraz daha koyulaştırıldı ("05" yerine "08")
  const rowColor = index % 2 === 0 ? "transparent" : colors.text + "08";

  // Render origin box
  const renderOriginBox = (origin: string) => {
    const color = originColors[origin] || colors.text + "20";
    return (
      <View
        style={[
          styles.originBox,
          {
            backgroundColor: color,
            width: 8,
            height: 24,
            marginRight: 8,
            borderRadius: 2,
          },
        ]}
      />
    );
  };

  const detailContent = (
    <View
      onLayout={onLayout}
      style={[
        styles.detailContent,
        { padding: 16, borderTopColor: colors.border },
      ]}
    >
      {/* Tanım - Tema rengi */}
      <View style={styles.detailSection}>
        <View
          style={[
            styles.detailHeader,
            {
              backgroundColor: colors.primary + "20",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              marginBottom: 8,
            },
          ]}
        >
          <CustomText
            style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: "600",
            }}
          >
            Tanım
          </CustomText>
        </View>
        <CustomText
          style={{
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
          }}
        >
          {word.definition}
        </CustomText>
      </View>

      <View style={styles.equivalentsContainer}>
        {/* Eski Karşılıklar */}
        <View style={styles.equivalentsSection}>
          <CustomText
            style={{
              fontSize: 12,
              color: colors.text + "80",
              marginBottom: 6,
            }}
          >
            Eski Karşılıklar
          </CustomText>
          <View
            style={[
              styles.boxContainer,
              {
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 12,
              },
            ]}
          >
            {word.old_equivalents.map((equivalent, idx) => (
              <CustomText
                key={idx}
                style={{
                  fontSize: 13,
                  color: colors.text,
                  marginBottom: idx < word.old_equivalents.length - 1 ? 4 : 0,
                }}
              >
                • {equivalent}
              </CustomText>
            ))}
          </View>
        </View>

        {/* Yeni Karşılıklar */}
        <View style={styles.equivalentsSection}>
          <CustomText
            style={{
              fontSize: 12,
              color: colors.text + "80",
              marginBottom: 6,
            }}
          >
            Yeni Karşılıklar
          </CustomText>
          <View
            style={[
              styles.boxContainer,
              {
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 12,
              },
            ]}
          >
            {word.new_equivalents.map((equivalent, idx) => (
              <CustomText
                key={idx}
                style={{
                  fontSize: 13,
                  color: colors.text,
                  marginBottom: idx < word.new_equivalents.length - 1 ? 4 : 0,
                }}
              >
                • {equivalent}
              </CustomText>
            ))}
          </View>
        </View>
      </View>

      {/* Unit and Stage Information */}
      {(word.word_unit || word.word_stage) && (
        <View
          style={[
            styles.unitInfoContainer,
            {
              backgroundColor: colors.primary + "10",
              borderRadius: 8,
              padding: 10,
              marginTop: 4, // DEĞİŞİKLİK: Karşılıklar alanıyla olan dikey mesafe azaltıldı
            },
          ]}
        >
          <CustomText
            style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: "600",
            }}
          >
            {word.word_unit && `Ünite ${word.word_unit}`}
            {word.word_unit && word.word_stage && " • "}
            {word.word_stage && `Aşama ${word.word_stage}`}
          </CustomText>
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: rowColor,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Main Row */}
      <TouchableOpacity onPress={toggleDetail} activeOpacity={0.7}>
        <View style={[styles.mainRow, isDesktop && { paddingVertical: 8 }]}>
          {/* Row Number */}
          <View
            style={[
              styles.rowNumberContainer,
              {
                width: 40,
                paddingHorizontal: 8,
              },
            ]}
          >
            <CustomText
              style={{
                fontSize: 14,
                color: colors.text + "80",
                textAlign: "center",
              }}
            >
              {index + 1}
            </CustomText>
          </View>

          {/* Old Turkish Word */}
          <View
            style={[
              styles.wordContainer,
              {
                flex: 3,
                paddingHorizontal: 8,
              },
            ]}
          >
            <View style={styles.wordContent}>
              {renderOriginBox(word.old_turkish_origin)}
              <CustomText
                style={{
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: "500",
                }}
                numberOfLines={1}
              >
                {word.old_turkish_word}
              </CustomText>
            </View>
            <CustomText
              style={{
                fontSize: 10,
                color: colors.text + "60",
                marginTop: 2,
              }}
            >
              {originNamesTR[word.old_turkish_origin]}
            </CustomText>
          </View>

          {/* New Turkish Word */}
          <View
            style={[
              styles.wordContainer,
              {
                flex: 3,
                paddingHorizontal: 8,
              },
            ]}
          >
            <View style={styles.wordContent}>
              {renderOriginBox(word.new_turkish_origin)}
              <CustomText
                style={{
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: "500",
                }}
                numberOfLines={1}
              >
                {word.new_turkish_word}
              </CustomText>
            </View>
            <CustomText
              style={{
                fontSize: 10,
                color: colors.text + "60",
                marginTop: 2,
              }}
            >
              {originNamesTR[word.new_turkish_origin]}
            </CustomText>
          </View>

          {/* Difficulty Level */}
          <View
            style={[
              styles.difficultyContainer,
              {
                width: 50,
                paddingHorizontal: 4,
              },
            ]}
          >
            <View style={styles.difficultyContent}>
              <CustomText
                style={{
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: "500",
                  marginRight: 2,
                }}
              >
                {word.difficulty_level}
              </CustomText>
              <Ionicons name="star" size={scale(16)} color="#FFD700" />
            </View>
          </View>

          {/* Bookmark Button */}
          <TouchableOpacity
            style={[
              styles.bookmarkContainer,
              {
                width: 40,
              },
            ]}
            onPress={() => onBookmarkToggle(word.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View
              style={{
                transform: [{ scale: bookmarkScale }],
                opacity: word.isSaved ? 1 : 0.5,
              }}
            >
              <Ionicons
                name={word.isSaved ? "bookmark" : "bookmark-outline"}
                size={isDesktop ? 20 : 24} // DEĞİŞİKLİK: İkon boyutu, incelen satır kalınlığına uyumlu olacak şekilde hafifçe küçültüldü
                color={word.isSaved ? "#FFD700" : colors.text}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Detail Row - Web & Mobil Uyumlu Animasyon */}
      {Platform.OS === "web" ? (
        <Animated.View
          style={[
            styles.detailContainer,
            {
              maxHeight: heightAnimation,
              opacity: contentOpacity,
            },
          ]}
        >
          {detailContent}
        </Animated.View>
      ) : (
        isDetailOpen && (
          <View style={styles.detailContainer}>{detailContent}</View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // DÜZELTME: Satır kalınlığı orijinal haline getirildi
    paddingHorizontal: 8,
  },
  rowNumberContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordContainer: {
    justifyContent: "center",
  },
  wordContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  originBox: {
    borderRadius: 2,
  },
  difficultyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  detailContainer: {
    overflow: "hidden",
  },
  detailContent: {
    borderTopWidth: 1,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailHeader: {
    alignSelf: "flex-start",
  },
  equivalentsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // DEĞİŞİKLİK: Karşılıklar alanının alt boşluğu azaltıldı
  },
  equivalentsSection: {
    flex: 1,
    marginRight: 12,
  },
  boxContainer: {
    minHeight: 60,
  },
  unitInfoContainer: {
    alignSelf: "center", // DEĞİŞİKLİK: Ünite ve aşama bilgisi tam ortaya hizalandı (flex-start -> center)
  },
});
