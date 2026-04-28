import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface Props {
  timeLeft: number;
  onExit: () => void;
}

export default function DuelHeader({ timeLeft, onExit }: Props) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

  return (
    <View
      style={[
        styles.container,
        // DEĞİŞİKLİK: Masaüstü için üst boşluklar kısıldı ve ortalandı
        {
          paddingTop: scale(isDesktop ? 10 : 50),
          paddingBottom: scale(isDesktop ? 4 : 10),
        },
        isDesktop && {
          maxWidth: scale(600),
          alignSelf: "center",
          width: "100%",
        },
      ]}
    >
      <View style={styles.timeContainer}>
        <Ionicons
          name="time-outline"
          size={scale(isDesktop ? 16 : 24)}
          color={timeLeft <= 10 ? "#F44336" : colors.primary}
        />
        <CustomText
          style={[
            styles.timeText,
            {
              color: timeLeft <= 10 ? "#F44336" : colors.text,
              fontSize: scale(isDesktop ? 14 : 18),
              marginLeft: scale(4),
            },
          ]}
        >
          {formatTime(timeLeft)}
        </CustomText>
      </View>
      <TouchableOpacity
        style={[
          styles.exitButton,
          isDesktop && { width: scale(24), height: scale(24) },
        ]}
        onPress={onExit}
      >
        <Ionicons
          name="close"
          size={scale(isDesktop ? 16 : 28)}
          color={colors.text}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  timeContainer: { flexDirection: "row", alignItems: "center" },
  timeText: { fontWeight: "600" },
  exitButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
