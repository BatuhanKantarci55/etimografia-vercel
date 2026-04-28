import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface FeedTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  tabs: { key: string; label: string }[];
}

export default function FeedTabs({
  activeTab,
  onTabPress,
  tabs,
}: FeedTabsProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View
              style={{
                backgroundColor: isActive
                  ? colors.primary + "20"
                  : "transparent",
                paddingHorizontal: scale(isDesktop ? 10 : 16),
                paddingVertical: scale(isDesktop ? 4 : 6),
                borderRadius: scale(isDesktop ? 8 : 16),
                overflow: "hidden", // DÜZELTME: Mobilde arka plan değişirken kavislerin (yuvarlak köşelerin) sivrilmesini kesin olarak engeller
              }}
            >
              <CustomText
                style={{
                  color: isActive ? colors.primary : colors.text + "80",
                  fontWeight: isActive ? "bold" : "600",
                  fontSize: scale(isDesktop ? 10 : 14),
                  textAlign: "center",
                }}
              >
                {tab.label}
              </CustomText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
