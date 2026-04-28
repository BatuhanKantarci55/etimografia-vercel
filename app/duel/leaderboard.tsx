import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getAvatarSource } from "@utils/avatarUtils";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { leaderboardColors } from "../../constants/LeaderboardColors";

export default function LeaderboardScreen() {
  const { user } = useAuth(); // DEĞİŞİKLİK: Mevcut kullanıcıyı tespit etmek için eklendi
  const { colors, themeMode } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const [activeTab, setActiveTab] = useState<"duel" | "practice">("duel");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const fetchMonthlyLeaderboard = async () => {
    setLoading(true);
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const sortColumn =
        activeTab === "duel" ? "duel_trophies" : "practice_score";

      const { data, error } = await supabase
        .from("monthly_leaderboards")
        .select(
          `
          *,
          profiles (
            username,
            avatar_index
          )
        `,
        )
        .eq("period", currentPeriod)
        .order(sortColumn, { ascending: false })
        .limit(100);

      if (error) {
        console.error("Liderlik sıralaması çekilirken hata:", error);
        return;
      }

      if (data) {
        const mappedData = data.map((item) => ({
          user_id: item.user_id,
          username: item.profiles?.username || "Kullanıcı",
          avatar_index: item.profiles?.avatar_index || 0,
          points:
            activeTab === "duel" ? item.duel_trophies : item.practice_score,
          statsText:
            activeTab === "duel"
              ? `${item.duel_wins}/${item.duel_losses}/${item.duel_draws}`
              : `${item.practice_correct}D ${item.practice_wrong}Y ${item.practice_highest_combo}K`,
        }));

        setLeaderboardData(mappedData.filter((m) => m.points > 0));
      }
    } catch (err) {
      console.error("Beklenmeyen hata:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonthlyLeaderboard();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyLeaderboard();
  };

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: scale(isDesktop ? 20 : 50) },
            isDesktop && {
              maxWidth: scale(600),
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.backButton,
              isDesktop && { width: scale(30), height: scale(30) },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={scale(isDesktop ? 20 : 24)}
              color={colors.text}
            />
          </TouchableOpacity>
          <CustomText
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: scale(isDesktop ? 16 : 20) },
            ]}
          >
            Aylık Liderlik Tablosu
          </CustomText>
          <View style={{ width: scale(isDesktop ? 30 : 40) }} />
        </View>

        {/* Düello ve Pratik Geçiş Kutusu */}
        <View
          style={[
            styles.tabSwitcherContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: scale(12),
              marginHorizontal: scale(20),
              marginBottom: scale(20),
              padding: scale(4),
            },
            isDesktop && {
              maxWidth: scale(300),
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "duel" && { backgroundColor: colors.primary },
              {
                borderRadius: scale(8),
                paddingVertical: scale(isDesktop ? 6 : 10),
              },
            ]}
            onPress={() => setActiveTab("duel")}
            activeOpacity={0.8}
          >
            <CustomText
              style={{
                color: activeTab === "duel" ? "white" : colors.text + "80",
                fontWeight: "600",
                fontSize: scale(isDesktop ? 13 : 15),
              }}
            >
              Düello
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "practice" && { backgroundColor: colors.primary },
              {
                borderRadius: scale(8),
                paddingVertical: scale(isDesktop ? 6 : 10),
              },
            ]}
            onPress={() => setActiveTab("practice")}
            activeOpacity={0.8}
          >
            <CustomText
              style={{
                color: activeTab === "practice" ? "white" : colors.text + "80",
                fontWeight: "600",
                fontSize: scale(isDesktop ? 13 : 15),
              }}
            >
              Pratik
            </CustomText>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={[
              styles.scrollContent,
              isDesktop && {
                maxWidth: scale(600),
                alignSelf: "center",
                width: "100%",
              },
            ]}
          >
            {/* Top 3 Podyum */}
            {leaderboardData.length >= 3 && (
              <View
                style={[
                  styles.podiumContainer,
                  isDesktop && { marginBottom: scale(15) },
                ]}
              >
                {/* 2. sıra (sol) */}
                <View style={[styles.podiumItem, styles.podiumSecond]}>
                  <Image
                    source={getAvatarSource(
                      leaderboardData[1]?.avatar_index || 0,
                    )}
                    style={[
                      styles.podiumAvatar,
                      {
                        width: scale(isDesktop ? 40 : 60),
                        height: scale(isDesktop ? 40 : 60),
                        borderRadius: scale(isDesktop ? 20 : 30),
                      },
                    ]}
                  />
                  <View
                    style={[styles.podiumBadge, { backgroundColor: "#C0C0C0" }]}
                  >
                    <CustomText
                      style={[
                        styles.podiumBadgeText,
                        {
                          color: "white",
                          fontSize: scale(isDesktop ? 10 : 12),
                        },
                      ]}
                    >
                      2
                    </CustomText>
                  </View>
                  <CustomText
                    style={[
                      styles.podiumName,
                      {
                        color: colors.text,
                        fontSize: scale(isDesktop ? 11 : 14),
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {leaderboardData[1]?.username}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.podiumPoints,
                      {
                        color: colors.primary,
                        fontSize: scale(isDesktop ? 13 : 16),
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {leaderboardData[1]?.points}
                  </CustomText>
                </View>

                {/* 1. sıra (orta) */}
                <View style={[styles.podiumItem, styles.podiumFirst]}>
                  <Image
                    source={getAvatarSource(
                      leaderboardData[0]?.avatar_index || 0,
                    )}
                    style={[
                      styles.podiumAvatar,
                      {
                        width: scale(isDesktop ? 60 : 80),
                        height: scale(isDesktop ? 60 : 80),
                        borderRadius: scale(isDesktop ? 30 : 40),
                      },
                    ]}
                  />
                  <View
                    style={[styles.podiumBadge, { backgroundColor: "#FFD700" }]}
                  >
                    <CustomText
                      style={[
                        styles.podiumBadgeText,
                        {
                          color: "white",
                          fontSize: scale(isDesktop ? 11 : 14),
                        },
                      ]}
                    >
                      1
                    </CustomText>
                  </View>
                  <CustomText
                    style={[
                      styles.podiumName,
                      {
                        color: colors.text,
                        fontSize: scale(isDesktop ? 13 : 16),
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {leaderboardData[0]?.username}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.podiumPoints,
                      {
                        color: colors.primary,
                        fontSize: scale(isDesktop ? 16 : 20),
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {leaderboardData[0]?.points}
                  </CustomText>
                </View>

                {/* 3. sıra (sağ) */}
                <View style={[styles.podiumItem, styles.podiumThird]}>
                  <Image
                    source={getAvatarSource(
                      leaderboardData[2]?.avatar_index || 0,
                    )}
                    style={[
                      styles.podiumAvatar,
                      {
                        width: scale(isDesktop ? 40 : 60),
                        height: scale(isDesktop ? 40 : 60),
                        borderRadius: scale(isDesktop ? 20 : 30),
                      },
                    ]}
                  />
                  <View
                    style={[styles.podiumBadge, { backgroundColor: "#CD7F32" }]}
                  >
                    <CustomText
                      style={[
                        styles.podiumBadgeText,
                        {
                          color: "white",
                          fontSize: scale(isDesktop ? 10 : 12),
                        },
                      ]}
                    >
                      3
                    </CustomText>
                  </View>
                  <CustomText
                    style={[
                      styles.podiumName,
                      {
                        color: colors.text,
                        fontSize: scale(isDesktop ? 11 : 14),
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {leaderboardData[2]?.username}
                  </CustomText>
                  <CustomText
                    style={[
                      styles.podiumPoints,
                      {
                        color: colors.primary,
                        fontSize: scale(isDesktop ? 13 : 16),
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {leaderboardData[2]?.points}
                  </CustomText>
                </View>
              </View>
            )}

            {/* Liderlik Listesi */}
            <View
              style={[
                styles.listCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.listHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <CustomText
                  style={[
                    styles.listHeaderText,
                    {
                      color: colors.text + "80",
                      fontSize: scale(12),
                      width: scale(isDesktop ? 30 : 40),
                    },
                  ]}
                >
                  #
                </CustomText>
                <CustomText
                  style={[
                    styles.listHeaderText,
                    { color: colors.text + "80", fontSize: scale(12), flex: 2 },
                  ]}
                >
                  Oyuncu
                </CustomText>
                <CustomText
                  style={[
                    styles.listHeaderText,
                    {
                      color: colors.text + "80",
                      fontSize: scale(12),
                      width: scale(isDesktop ? 100 : 80),
                      textAlign: "center",
                    },
                  ]}
                >
                  {activeTab === "duel" ? "G/M/B" : "D/Y/K"}
                </CustomText>
                <CustomText
                  style={[
                    styles.listHeaderText,
                    {
                      color: colors.text + "80",
                      fontSize: scale(12),
                      width: scale(isDesktop ? 60 : 70),
                      textAlign: "center",
                    },
                  ]}
                >
                  {activeTab === "duel" ? "Kupa" : "Puan"}
                </CustomText>
              </View>

              {leaderboardData.map((entry, index) => {
                const isCurrentUser = entry.user_id === user?.id;
                const rank = index + 1;
                let gradientColors = null;

                // DEĞİŞİKLİK: 1., 2., 3. sıradakilere ve kendimize gradyan arkaplan ayarlanıyor
                if (rank === 1)
                  gradientColors = leaderboardColors[themeMode].first;
                else if (rank === 2)
                  gradientColors = leaderboardColors[themeMode].second;
                else if (rank === 3)
                  gradientColors = leaderboardColors[themeMode].third;
                else if (isCurrentUser)
                  gradientColors = leaderboardColors[themeMode].currentUser;

                // Gradyan varsa LinearGradient, yoksa normal View döndürülüyor
                const RowComponent = gradientColors
                  ? LinearGradient
                  : (View as any);
                const rowProps = gradientColors
                  ? {
                      colors: gradientColors,
                      start: { x: 0, y: 0 },
                      end: { x: 1, y: 0 },
                    }
                  : {};

                return (
                  <RowComponent
                    key={entry.user_id}
                    {...rowProps}
                    style={[
                      styles.listRow,
                      // Gradyan olan satırlarda alt çizgi gösterilmez (daha temiz bir görünüm için)
                      !gradientColors &&
                        index < leaderboardData.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        },
                      isDesktop && { paddingVertical: scale(8) },
                    ]}
                  >
                    <View
                      style={[
                        styles.rankContainer,
                        { width: scale(isDesktop ? 30 : 40) },
                      ]}
                    >
                      <CustomText
                        style={[
                          styles.rankText,
                          {
                            color: rank <= 3 ? colors.text : colors.text + "60",
                            fontSize: scale(isDesktop ? 13 : 15),
                            fontWeight: rank <= 3 ? "bold" : "500",
                          },
                        ]}
                      >
                        {rank}
                      </CustomText>
                    </View>

                    <View style={[styles.playerContainer, { flex: 2 }]}>
                      <Image
                        source={getAvatarSource(entry.avatar_index || 0)}
                        style={[
                          styles.playerAvatar,
                          {
                            width: scale(isDesktop ? 24 : 30),
                            height: scale(isDesktop ? 24 : 30),
                            borderRadius: scale(isDesktop ? 12 : 15),
                          },
                        ]}
                      />
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <CustomText
                          style={[
                            styles.playerName,
                            {
                              color: colors.text,
                              fontSize: scale(isDesktop ? 13 : 14),
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {entry.username}
                        </CustomText>

                        {/* DEĞİŞİKLİK: Kendimize ait satırda "Siz" etiketi gösteriliyor */}
                        {isCurrentUser && (
                          <View
                            style={[
                              styles.youBadge,
                              { borderColor: colors.text + "60" },
                            ]}
                          >
                            <CustomText
                              style={{
                                fontSize: scale(isDesktop ? 9 : 10),
                                color: colors.text + "90",
                                fontWeight: "600",
                              }}
                            >
                              Siz
                            </CustomText>
                          </View>
                        )}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.wdlContainer,
                        { width: scale(isDesktop ? 100 : 80) },
                      ]}
                    >
                      <CustomText
                        style={[
                          styles.wdlText,
                          {
                            color: colors.text + "80",
                            fontSize: scale(isDesktop ? 11 : 12),
                            textAlign: "center",
                          },
                        ]}
                      >
                        {entry.statsText}
                      </CustomText>
                    </View>

                    <View
                      style={[
                        styles.pointsContainer,
                        { width: scale(isDesktop ? 60 : 70) },
                      ]}
                    >
                      <CustomText
                        style={[
                          styles.pointsText,
                          {
                            color: colors.primary,
                            fontSize: scale(isDesktop ? 13 : 14),
                            fontWeight: "bold",
                            textAlign: "center",
                          },
                        ]}
                      >
                        {entry.points}
                      </CustomText>
                    </View>
                  </RowComponent>
                );
              })}

              {leaderboardData.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="trophy-outline"
                    size={scale(isDesktop ? 36 : 50)}
                    color={colors.text + "40"}
                  />
                  <CustomText
                    style={[
                      styles.emptyText,
                      {
                        color: colors.text + "80",
                        fontSize: scale(16),
                        marginTop: scale(10),
                      },
                    ]}
                  >
                    Henüz liderlik verisi yok
                  </CustomText>
                </View>
              )}
            </View>

            <View style={{ height: scale(20) }} />
          </ScrollView>
        )}
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
  tabSwitcherContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  podiumItem: {
    alignItems: "center",
    marginHorizontal: 5,
  },
  podiumFirst: {
    marginBottom: 0,
    zIndex: 2,
  },
  podiumSecond: {
    marginBottom: 20,
    zIndex: 1,
  },
  podiumThird: {
    marginBottom: 20,
    zIndex: 1,
  },
  podiumAvatar: {
    borderWidth: 3,
    borderColor: "white",
  },
  podiumBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  podiumBadgeText: { fontWeight: "bold" },
  podiumName: { fontWeight: "600", marginTop: 5, textAlign: "center" },
  podiumPoints: { fontWeight: "bold" },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  listHeaderText: { fontWeight: "500" },
  listRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  rankContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: { fontWeight: "500" },
  playerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playerAvatar: { marginRight: 4 },
  playerName: { flexShrink: 1 }, // Uzun isimlerin "Siz" etiketini dışarı atmasını önler
  youBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  wdlContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  wdlText: { fontWeight: "500" },
  pointsContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pointsText: { fontWeight: "bold" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: { textAlign: "center" },
});
