import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface CompletionScreenProps {
  type: "success" | "timeout";
  wordCount: number;
  totalWords: number;
  onHomePress: () => void;
}

export default function CompletionScreen({
  type,
  wordCount,
  totalWords,
  onHomePress,
}: CompletionScreenProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  const isSuccess = type === "success";

  return (
    <View style={styles.container}>
      {/* Kuş Maskotu */}
      <Image
        source={require("@assets/images/mascot/bird.png")}
        style={[
          styles.mascotImage,
          {
            width: scale(150),
            height: scale(150),
          },
        ]}
        resizeMode="contain"
      />

      {/* Konuşma Balonu */}
      <View style={[styles.bubbleWrapper, { marginTop: scale(20) }]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {isSuccess ? (
            <>
              <Ionicons
                name="checkmark-done-circle"
                size={scale(50)}
                color={colors.primary}
                style={styles.icon}
              />
              <CustomText
                style={[
                  styles.bubbleTitle,
                  {
                    color: colors.text,
                    fontSize: scale(24),
                  },
                ]}
              >
                Tebrikler!
              </CustomText>
              <CustomText
                style={[
                  styles.bubbleText,
                  {
                    color: colors.text + "80",
                    fontSize: scale(16),
                  },
                ]}
              >
                {wordCount}/{totalWords} kelimeyi doğru bildiniz.
              </CustomText>
            </>
          ) : (
            <>
              <Ionicons
                name="hourglass-outline"
                size={scale(50)}
                color="#F44336"
                style={styles.icon}
              />
              <CustomText
                style={[
                  styles.bubbleTitle,
                  {
                    color: colors.text,
                    fontSize: scale(24),
                  },
                ]}
              >
                Süreniz Doldu!
              </CustomText>
              <CustomText
                style={[
                  styles.bubbleText,
                  {
                    color: colors.text + "80",
                    fontSize: scale(16),
                  },
                ]}
              >
                {wordCount}/{totalWords} kelimeyi doğru bildiniz. Tekrar
                deneyebilirsiniz.
              </CustomText>
            </>
          )}
        </View>
        <View
          style={[
            styles.bubbleTail,
            {
              borderTopColor: colors.card,
            },
          ]}
        />
      </View>

      {/* Ana Sayfaya Dön Butonu */}
      <TouchableOpacity
        style={[
          styles.homeButton,
          {
            backgroundColor: colors.primary,
            paddingHorizontal: scale(40),
            paddingVertical: scale(15),
            borderRadius: scale(30),
            marginTop: scale(40),
          },
        ]}
        onPress={onHomePress}
        activeOpacity={0.8}
      >
        <CustomText
          style={[
            styles.homeButtonText,
            {
              color: "white",
              fontSize: scale(18),
            },
          ]}
        >
          Ana Sayfaya Dön
        </CustomText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  mascotImage: {
    marginBottom: 20,
  },
  bubbleWrapper: {
    alignItems: "center",
    width: "100%",
  },
  bubble: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
  },
  icon: {
    marginBottom: 10,
  },
  bubbleTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  bubbleText: {
    textAlign: "center",
    lineHeight: 22,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white",
    marginTop: -1,
  },
  homeButton: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  homeButtonText: {
    fontWeight: "600",
  },
});
