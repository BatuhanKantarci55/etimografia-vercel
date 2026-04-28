import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface TransitionScreenProps {
  message: string;
  onNext: () => void;
}

export default function TransitionScreen({
  message,
  onNext,
}: TransitionScreenProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  console.log(
    "🎬 TransitionScreen render edildi, message:",
    message.substring(0, 30) + "...",
  );

  return (
    <View
      style={[
        styles.container,
        // DEĞİŞİKLİK: Masaüstünde butonları ve içerikleri ortalamak için genişlik sınırlandırıldı
        isDesktop && {
          maxWidth: scale(500),
          alignSelf: "center",
          width: "100%",
        },
      ]}
    >
      <Image
        source={require("@assets/images/mascot/bird.png")}
        style={[
          styles.mascotImage,
          {
            // DEĞİŞİKLİK: Masaüstünde kuş maskotu boyutu küçültüldü (150 -> 100)
            width: scale(isDesktop ? 100 : 150),
            height: scale(isDesktop ? 100 : 150),
          },
        ]}
        resizeMode="contain"
      />

      <View
        style={[
          styles.bubbleWrapper,
          // DEĞİŞİKLİK: Masaüstünde kelime balonunun kuşa daha yakın olması için üst boşluğu azaltıldı
          { marginTop: scale(isDesktop ? 10 : 20) },
        ]}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <CustomText
            style={[
              styles.bubbleText,
              {
                color: colors.text,
                fontSize: scale(18),
              },
            ]}
          >
            {message}
          </CustomText>
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

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            backgroundColor: colors.primary,
            paddingHorizontal: scale(40),
            paddingVertical: scale(15),
            borderRadius: scale(30),
            // DEĞİŞİKLİK: İleri butonunun mesaj balonuna daha yakın durması için üst boşluğu azaltıldı
            marginTop: scale(isDesktop ? 20 : 40),
          },
        ]}
        onPress={() => {
          console.log("👆 TransitionScreen İleri butonuna basıldı");
          onNext();
        }}
        activeOpacity={0.8}
      >
        <CustomText
          style={[
            styles.nextButtonText,
            {
              color: "white",
              fontSize: scale(18),
            },
          ]}
        >
          İleri
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
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    width: "100%",
  },
  bubbleText: {
    textAlign: "center",
    lineHeight: 24,
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
  nextButton: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    fontWeight: "600",
  },
});
