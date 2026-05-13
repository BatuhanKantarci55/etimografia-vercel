import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

const termsData = require("@assets/data/legal/terms-of-service.json");

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TermsModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { scale, isDesktop, wp } = useResponsive();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderRadius: scale(isDesktop ? 12 : 20),
            },
            isDesktop
              ? { width: 500, maxHeight: "80%" }
              : { width: wp(90), maxHeight: "85%" },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <CustomText
              style={[
                styles.title,
                { color: colors.text, fontSize: scale(isDesktop ? 16 : 20) },
              ]}
            >
              {termsData.title}
            </CustomText>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={scale(isDesktop ? 20 : 28)}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
          >
            <CustomText
              style={[
                styles.lastUpdated,
                { color: colors.text + "80", fontSize: scale(12) },
              ]}
            >
              Son Güncelleme: {termsData.lastUpdated}
            </CustomText>

            {termsData.sections.map((section: any, index: number) => (
              <View key={index} style={styles.section}>
                <CustomText
                  style={[
                    styles.sectionHeading,
                    { color: colors.primary, fontSize: scale(14) },
                  ]}
                >
                  {section.heading}
                </CustomText>
                <CustomText
                  style={[
                    styles.sectionBody,
                    { color: colors.text, fontSize: scale(13) },
                  ]}
                >
                  {section.body}
                </CustomText>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary, borderRadius: scale(10) },
            ]}
            onPress={onClose}
          >
            <CustomText
              style={[
                styles.buttonText,
                { fontSize: scale(isDesktop ? 14 : 16) },
              ]}
            >
              Anladım
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  title: { fontWeight: "bold" },
  scrollArea: { marginBottom: 20 },
  lastUpdated: { marginBottom: 16, fontStyle: "italic" },
  section: { marginBottom: 20 },
  sectionHeading: { fontWeight: "bold", marginBottom: 8 },
  sectionBody: { lineHeight: 22 },
  button: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
});
