import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface DataNotSavedWarningModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function DataNotSavedWarningModal({
  visible,
  onClose,
  onContinue,
}: DataNotSavedWarningModalProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const handleLoginPress = () => {
    onClose();
    router.push("/(auth)");
  };

  const handleContinuePress = () => {
    onClose();
    onContinue();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Uyarı"
      height={isDesktop ? "auto" : "50%"}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: "#FF9500" + "15",
              width: scale(80),
              height: scale(80),
              borderRadius: scale(40),
            },
          ]}
        >
          <Ionicons name="warning" size={scale(40)} color="#FF9500" />
        </View>

        <CustomText
          style={[
            styles.description,
            { color: colors.text, fontSize: scale(14) },
          ]}
        >
          Bu işlemi gerçekleştirebilirsiniz ancak giriş yapmadığınız için
          sonuçlarınız ve ilerlemeniz veri tabanına kaydedilmeyecektir.
        </CustomText>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor: colors.primary,
                borderRadius: scale(12),
                paddingVertical: scale(14),
              },
            ]}
            onPress={handleContinuePress}
            activeOpacity={0.8}
          >
            <CustomText
              style={[
                styles.secondaryButtonText,
                { color: colors.primary, fontSize: scale(14) },
              ]}
            >
              Giriş Yapmadan Devam Et
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: scale(12),
                paddingVertical: scale(14),
              },
            ]}
            onPress={handleLoginPress}
            activeOpacity={0.8}
          >
            <CustomText
              style={[styles.primaryButtonText, { fontSize: scale(14) }]}
            >
              Giriş Yap
            </CustomText>
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
