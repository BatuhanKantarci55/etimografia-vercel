import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface ExitConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExitConfirmationModal({
  visible,
  onConfirm,
  onCancel,
}: ExitConfirmationModalProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderRadius: scale(20),
              padding: scale(24),
            },
          ]}
        >
          <Ionicons name="warning" size={scale(50)} color="#FFA500" />

          <CustomText
            style={[
              styles.modalTitle,
              { color: colors.text, fontSize: scale(20) },
            ]}
          >
            Adımdan Çık
          </CustomText>

          <CustomText
            style={[
              styles.modalMessage,
              { color: colors.text + "80", fontSize: scale(16) },
            ]}
          >
            Adımdan çıkmak istediğinizden emin misiniz? Yaptığınız işaretlemeler
            kaydedilmeyecek.
          </CustomText>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalCancelButton,
                {
                  backgroundColor: colors.primary + "20",
                  paddingVertical: scale(12),
                  borderRadius: scale(12),
                },
              ]}
              onPress={onCancel}
            >
              <CustomText
                style={[styles.modalButtonText, { color: colors.text }]}
              >
                Vazgeç
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalConfirmButton,
                {
                  backgroundColor: "#F44336",
                  paddingVertical: scale(12),
                  borderRadius: scale(12),
                },
              ]}
              onPress={onConfirm}
            >
              <CustomText style={[styles.modalButtonText, { color: "white" }]}>
                Çık
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    borderWidth: 0,
  },
  modalConfirmButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
