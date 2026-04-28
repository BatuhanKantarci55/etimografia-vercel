import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface UserProfileHeaderProps {
  profile: {
    full_name: string | null;
    followers_count: number;
    following_count: number;
    posts_count: number;
  };
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function UserProfileHeader({
  profile,
  activeTab,
  onTabPress,
}: UserProfileHeaderProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  // 4 bölmeli istatistikler
  const statsData = {
    gönderi: profile.posts_count,
    takipçi: profile.followers_count,
    rozet: 12, // Şimdilik mock
    sıralama: 42, // Şimdilik mock
  };

  const tabs = [
    { key: "gönderi", label: "Gönderi" },
    { key: "takipçi", label: "Takipçi" },
    { key: "rozet", label: "Rozet" },
    { key: "sıralama", label: "Sıralama" },
  ];

  return (
    <View style={styles.container}>
      {/* Ad Soyad */}
      <CustomText
        style={[
          styles.nameText,
          {
            fontSize: scale(24),
            color: colors.text,
            marginBottom: scale(15),
          },
        ]}
      >
        {profile.full_name || "Ad Soyad"}
      </CustomText>

      {/* 4 Bölmeli İstatistikler */}
      <View style={[styles.statsContainer, { marginBottom: scale(20) }]}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.statItem}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <CustomText
              style={[
                styles.statNumber,
                {
                  fontSize: scale(22),
                  color: colors.text,
                },
              ]}
            >
              {statsData[tab.key as keyof typeof statsData]}
            </CustomText>
            <CustomText
              style={[
                styles.statLabel,
                {
                  fontSize: scale(12),
                  color: colors.text + "CC",
                },
              ]}
            >
              {tab.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  nameText: {
    fontWeight: "600",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontWeight: "500",
  },
});
