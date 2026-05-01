import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface AuthRequiredModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AuthRequiredModal({
  visible,
  onClose,
}: AuthRequiredModalProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const handleLoginPress = () => {
    onClose();
    router.push("/(auth)");
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Giriş Gerekli"
      height={isDesktop ? "auto" : "45%"}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primary + "15",
              width: scale(80),
              height: scale(80),
              borderRadius: scale(40),
            },
          ]}
        >
          <Ionicons
            name="lock-closed"
            size={scale(40)}
            color={colors.primary}
          />
        </View>

        <CustomText
          style={[
            styles.description,
            { color: colors.text, fontSize: scale(14) },
          ]}
        >
          Bu işlemi gerçekleştirmek, ilerlemenizi kaydetmek ve tüm özelliklerden
          yararlanmak için giriş yapmanız gerekmektedir.
        </CustomText>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              borderRadius: scale(12),
              paddingVertical: scale(14),
            },
          ]}
          onPress={handleLoginPress}
          activeOpacity={0.8}
        >
          <CustomText style={[styles.buttonText, { fontSize: scale(16) }]}>
            Giriş Yap / Kayıt Ol
          </CustomText>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  description: {
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
