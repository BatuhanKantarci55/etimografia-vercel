import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const privacyData = require("@assets/data/legal/privacy-policy.json");

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        <View
          style={[styles.header, { paddingTop: scale(isDesktop ? 20 : 50) }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={scale(24)} color={colors.text} />
          </TouchableOpacity>
          <CustomText
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: scale(20) },
            ]}
          >
            {privacyData.title}
          </CustomText>
          <View style={{ width: scale(40) }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isDesktop && { maxWidth: 800, alignSelf: "center", width: "100%" },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <CustomText
              style={[
                styles.lastUpdated,
                { color: colors.text + "80", fontSize: scale(12) },
              ]}
            >
              Son Güncelleme: {privacyData.lastUpdated}
            </CustomText>

            {privacyData.sections.map((section: any, index: number) => (
              <View key={index} style={styles.section}>
                <CustomText
                  style={[
                    styles.sectionHeading,
                    { color: colors.primary, fontSize: scale(16) },
                  ]}
                >
                  {section.heading}
                </CustomText>
                <CustomText
                  style={[
                    styles.sectionBody,
                    { color: colors.text, fontSize: scale(14) },
                  ]}
                >
                  {section.body}
                </CustomText>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontWeight: "600" },
  content: { padding: 20, paddingBottom: 60 },
  card: { padding: 24, borderRadius: 16, borderWidth: 1 },
  lastUpdated: { marginBottom: 20, fontStyle: "italic" },
  section: { marginBottom: 24 },
  sectionHeading: { fontWeight: "bold", marginBottom: 8 },
  sectionBody: { lineHeight: 24 },
});
