import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useFollow } from "@contexts/FollowContext";
import { usePosts } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ProfileHeaderProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  onTabSelect?: (tabIndex: number) => void;
}

export default function ProfileHeader({
  activeTab,
  onTabPress,
  onTabSelect,
}: ProfileHeaderProps) {
  const { profile } = useAuth();
  const { stats } = useFollow();
  const { userPosts } = usePosts();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    const ownPostsCount = userPosts.filter(
      (post) => !post.is_shared_post,
    ).length;
    setPostCount(ownPostsCount);
  }, [userPosts]);

  // 4 bölmeli istatistikler
  const statsData = {
    gönderi: postCount,
    takipçi: stats?.followers_count || 0,
    rozet: 12, // Şimdilik mock
    sıralama: 42, // Şimdilik mock
  };

  const tabs = [
    { key: "gönderi", label: "Gönderi" },
    { key: "takipçi", label: "Takipçi" },
    { key: "rozet", label: "Rozet" },
    { key: "sıralama", label: "Sıralama" },
  ];

  const handleStatPress = (tabKey: string, index: number) => {
    onTabPress(tabKey);
    if (onTabSelect) {
      onTabSelect(index);
    }
  };

  return (
    // DÜZELTME: Tıklamaları engellememesi için en alt katmana atandı (zIndex: 1)
    <View
      style={[
        styles.container,
        { zIndex: 1, elevation: 1, position: "relative" },
      ]}
    >
      {/* Ad Soyad */}
      <CustomText
        style={[
          styles.nameText,
          {
            fontSize: scale(isDesktop ? 18 : 24),
            color: colors.text,
            marginBottom: scale(isDesktop ? 8 : 15),
          },
        ]}
      >
        {profile?.full_name || "Ad Soyad"}
      </CustomText>

      {/* 4 Bölmeli İstatistikler */}
      <View
        style={[
          styles.statsContainer,
          { marginBottom: scale(isDesktop ? 12 : 20) },
        ]}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.statItem}
            onPress={() => handleStatPress(tab.key, index)}
            activeOpacity={0.7}
          >
            <CustomText
              style={[
                styles.statNumber,
                {
                  fontSize: scale(isDesktop ? 16 : 22),
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
                  fontSize: scale(isDesktop ? 10 : 12),
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
