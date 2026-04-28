import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

interface InputBoxProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  isCloseMatch?: boolean;
  correctAnswer?: string;
  autoFocus?: boolean;
}

export default function InputBox({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Cevabınızı yazın...",
  disabled = false,
  showResult = false,
  isCorrect = false,
  isCloseMatch = false,
  correctAnswer,
  autoFocus = true,
}: InputBoxProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const answerOpacity = useRef(new Animated.Value(0)).current;

  // Debug için prop'ları logla
  useEffect(() => {
    if (showResult) {
      console.log(
        `🎨 InputBox - showResult: true, isCorrect: ${isCorrect}, isCloseMatch: ${isCloseMatch}`,
      );
    }
  }, [showResult, isCorrect, isCloseMatch]);

  // Otomatik focus
  useEffect(() => {
    if (autoFocus && !disabled && !showResult) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [autoFocus, disabled, showResult]);

  // Sonuç gösterildiğinde animasyon
  useEffect(() => {
    if (showResult) {
      if (!isCorrect) {
        // Yanlış veya yakın eşleşme - doğru cevabı göster
        Animated.timing(answerOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }

      if (!isCorrect && !isCloseMatch) {
        // Tamamen yanlış cevap animasyonu - sallama
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();

        // Kırmızı yanıp sönme
        Animated.sequence([
          Animated.timing(wrongAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.timing(wrongAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
          }),
        ]).start();
      }
    } else {
      answerOpacity.setValue(0);
    }
  }, [showResult, isCorrect, isCloseMatch]);

  const getBackgroundColor = () => {
    if (!showResult) {
      return colors.card; // Normal durum
    }

    // Önce doğru/kısmi doğru durumlarını kontrol et
    if (isCorrect) {
      return "#4CAF50"; // Düz yeşil
    }

    if (isCloseMatch) {
      return "#FFA500"; // Turuncu - yakın eşleşme
    }

    return "#F44336"; // Düz kırmızı (tamamen yanlış)
  };

  const getTextColor = () => {
    if (!showResult) return colors.text;
    return "white";
  };

  const handleSubmitEditing = () => {
    if (!disabled && !showResult && value.trim()) {
      onSubmit();
    }
  };

  // Arka plan rengini al ve logla
  const bgColor = getBackgroundColor();
  if (showResult) {
    console.log(
      `🎨 Seçilen renk: ${bgColor} (isCorrect: ${isCorrect}, isCloseMatch: ${isCloseMatch})`,
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            transform: [{ translateX: shakeAnim }],
            backgroundColor: bgColor,
            // DEĞİŞİKLİK: Masaüstü için köşe kavisi küçültüldü (8)
            borderRadius: scale(isDesktop ? 8 : 12),
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: getTextColor(),
              // DEĞİŞİKLİK: Masaüstü için metin boyutu ve dikey boşluklar küçültüldü (Kontrol et butonuyla aynı)
              fontSize: scale(isDesktop ? 13 : 18),
              paddingVertical: scale(isDesktop ? 10 : 16),
              paddingHorizontal: scale(16),
              fontFamily: undefined,
            },
            // DEĞİŞİKLİK: Web'de inputa tıklayınca çıkan çirkin siyah odak çizgisi kaldırıldı
            Platform.OS === "web" && ({ outlineStyle: "none" } as any),
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            !showResult ? colors.text + "40" : "rgba(255,255,255,0.5)"
          }
          editable={!disabled && !showResult}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="done"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Animated.View>

      {/* Doğru cevap gösterimi (yanlış veya yakın eşleşmede) */}
      {correctAnswer && showResult && !isCorrect && (
        <Animated.View
          style={[
            styles.correctAnswerContainer,
            {
              opacity: answerOpacity,
              marginTop: scale(8),
            },
          ]}
        >
          <CustomText
            style={[
              styles.correctAnswerText,
              { color: colors.text + "80", fontSize: scale(14) },
            ]}
          >
            {isCloseMatch ? "Yazım hatasız hali: " : "Doğru cevap: "}
          </CustomText>
          <CustomText
            style={[
              styles.correctAnswerValue,
              { color: "#4CAF50", fontSize: scale(16), fontWeight: "600" },
            ]}
          >
            {correctAnswer}
          </CustomText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputWrapper: {
    overflow: "hidden",
  },
  input: {
    textAlign: "center",
  },
  correctAnswerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  correctAnswerText: {},
  correctAnswerValue: {},
});
