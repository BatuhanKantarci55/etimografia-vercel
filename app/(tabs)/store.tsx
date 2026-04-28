import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function StoreScreen() {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: scale(50) }]}>
          <View style={styles.headerPlaceholder} />
          <CustomText
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: scale(20) },
            ]}
          >
            Mağaza
          </CustomText>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* İçerik */}
        <View style={styles.content}>
          <View
            style={[
              styles.comingSoonCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="construct-outline"
                size={scale(60)}
                color={colors.primary}
              />
            </View>

            <CustomText
              style={[
                styles.comingSoonTitle,
                { color: colors.text, fontSize: scale(28) },
              ]}
            >
              Yakında!
            </CustomText>

            <CustomText
              style={[
                styles.comingSoonText,
                { color: colors.text + "80", fontSize: scale(16) },
              ]}
            >
              Mağaza sayfamız şu anda hazırlanıyor.
            </CustomText>

            <CustomText
              style={[
                styles.comingSoonSubtext,
                { color: colors.text + "60", fontSize: scale(14) },
              ]}
            >
              Yakında buradan özel paketler, kahramanlar ve daha fazlasını satın
              alabileceksiniz!
            </CustomText>
          </View>
        </View>
      </View>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  comingSoonCard: {
    width: "100%",
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  comingSoonText: {
    textAlign: "center",
    marginBottom: 8,
  },
  comingSoonSubtext: {
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  featureItem: {
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
