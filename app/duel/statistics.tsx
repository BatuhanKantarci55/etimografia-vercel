import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useDuel } from "@contexts/DuelContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { getAvatarSource } from "@utils/avatarUtils";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

export default function DuelStatisticsScreen() {
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const {
    userStats,
    duelHistory,
    fetchUserStats,
    fetchDuelHistory,
    isLoading,
  } = useDuel();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchUserStats(), fetchDuelHistory()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getResultText = (history: any) => {
    if (!history.winner_id) return "Berabere";
    if (history.winner_id === history.player1_id) {
      return history.player1_id === userStats?.user_id
        ? "Galibiyet"
        : "Mağlubiyet";
    } else {
      return history.player2_id === userStats?.user_id
        ? "Galibiyet"
        : "Mağlubiyet";
    }
  };

  const getResultColor = (history: any) => {
    if (!history.winner_id) return "#FFA500"; // Berabere - turuncu
    if (history.winner_id === userStats?.user_id) return "#4CAF50"; // Galibiyet - yeşil
    return "#F44336"; // Mağlubiyet - kırmızı
  };

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: scale(50) }]}>
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
            Düello İstatistikleri
          </CustomText>
          <View style={{ width: scale(40) }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Özet Kart */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <CustomText
              style={[
                styles.sectionTitle,
                { color: colors.text, fontSize: scale(18) },
              ]}
            >
              Özet İstatistikler
            </CustomText>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons
                  name="git-compare"
                  size={scale(28)}
                  color={colors.primary}
                />
                <CustomText
                  style={[
                    styles.statValue,
                    { color: colors.text, fontSize: scale(24) },
                  ]}
                >
                  {userStats?.total_duels || 0}
                </CustomText>
                <CustomText
                  style={[
                    styles.statLabel,
                    { color: colors.text + "80", fontSize: scale(12) },
                  ]}
                >
                  Toplam Düello
                </CustomText>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="trophy" size={scale(28)} color="#FFD700" />
                <CustomText
                  style={[
                    styles.statValue,
                    { color: colors.text, fontSize: scale(24) },
                  ]}
                >
                  {userStats?.wins || 0}
                </CustomText>
                <CustomText
                  style={[
                    styles.statLabel,
                    { color: colors.text + "80", fontSize: scale(12) },
                  ]}
                >
                  Galibiyet
                </CustomText>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="sad-outline" size={scale(28)} color="#F44336" />
                <CustomText
                  style={[
                    styles.statValue,
                    { color: colors.text, fontSize: scale(24) },
                  ]}
                >
                  {userStats?.losses || 0}
                </CustomText>
                <CustomText
                  style={[
                    styles.statLabel,
                    { color: colors.text + "80", fontSize: scale(12) },
                  ]}
                >
                  Mağlubiyet
                </CustomText>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="remove" size={scale(28)} color="#FFA500" />
                <CustomText
                  style={[
                    styles.statValue,
                    { color: colors.text, fontSize: scale(24) },
                  ]}
                >
                  {userStats?.draws || 0}
                </CustomText>
                <CustomText
                  style={[
                    styles.statLabel,
                    { color: colors.text + "80", fontSize: scale(12) },
                  ]}
                >
                  Berabere
                </CustomText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={styles.statsRowItem}>
                <Ionicons name="cube" size={scale(20)} color={colors.primary} />
                <CustomText
                  style={[
                    styles.statsRowLabel,
                    { color: colors.text + "80", fontSize: scale(14) },
                  ]}
                >
                  Toplam Kule Parçası:
                </CustomText>
                <CustomText
                  style={[
                    styles.statsRowValue,
                    {
                      color: colors.text,
                      fontSize: scale(16),
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {userStats?.total_tower_pieces || 0}
                </CustomText>
              </View>

              <View style={styles.statsRowItem}>
                <Ionicons name="flash" size={scale(20)} color="#FFD700" />
                <CustomText
                  style={[
                    styles.statsRowLabel,
                    { color: colors.text + "80", fontSize: scale(14) },
                  ]}
                >
                  Toplam Puan:
                </CustomText>
                <CustomText
                  style={[
                    styles.statsRowValue,
                    {
                      color: colors.text,
                      fontSize: scale(16),
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {userStats?.total_points || 0}
                </CustomText>
              </View>
            </View>

            {userStats && userStats.total_duels > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statsRowItem}>
                  <Ionicons
                    name="stats-chart"
                    size={scale(20)}
                    color="#4CAF50"
                  />
                  <CustomText
                    style={[
                      styles.statsRowLabel,
                      { color: colors.text + "80", fontSize: scale(14) },
                    ]}
                  >
                    Galibiyet Oranı:
                  </CustomText>
                  <CustomText
                    style={[
                      styles.statsRowValue,
                      {
                        color: colors.text,
                        fontSize: scale(16),
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    %
                    {((userStats.wins / userStats.total_duels) * 100).toFixed(
                      1,
                    )}
                  </CustomText>
                </View>

                <View style={styles.statsRowItem}>
                  <Ionicons
                    name="calculator"
                    size={scale(20)}
                    color="#FFA500"
                  />
                  <CustomText
                    style={[
                      styles.statsRowLabel,
                      { color: colors.text + "80", fontSize: scale(14) },
                    ]}
                  >
                    Ortalama Puan:
                  </CustomText>
                  <CustomText
                    style={[
                      styles.statsRowValue,
                      {
                        color: colors.text,
                        fontSize: scale(16),
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {Math.round(userStats.total_points / userStats.total_duels)}
                  </CustomText>
                </View>
              </View>
            )}
          </View>

          {/* Son 20 Maç */}
          <View
            style={[
              styles.historyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <CustomText
              style={[
                styles.sectionTitle,
                { color: colors.text, fontSize: scale(18) },
              ]}
            >
              Son 20 Maç
            </CustomText>

            {duelHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="time-outline"
                  size={scale(50)}
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
                  Henüz düello geçmişi yok
                </CustomText>
              </View>
            ) : (
              duelHistory.map((history, index) => {
                const resultText = getResultText(history);
                const resultColor = getResultColor(history);
                const isPlayer1 = history.player1_id === userStats?.user_id;
                const opponent = isPlayer1 ? history.player2 : history.player1;
                const playerPieces = isPlayer1
                  ? history.player1_tower_pieces
                  : history.player2_tower_pieces;
                const opponentPieces = isPlayer1
                  ? history.player2_tower_pieces
                  : history.player1_tower_pieces;
                const playerPoints = isPlayer1
                  ? history.player1_points
                  : history.player2_points;

                return (
                  <View
                    key={history.id}
                    style={[
                      styles.historyItem,
                      index < duelHistory.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.historyHeader}>
                      <View style={styles.historyResult}>
                        <View
                          style={[
                            styles.resultBadge,
                            { backgroundColor: resultColor + "20" },
                          ]}
                        >
                          <CustomText
                            style={[
                              styles.resultText,
                              { color: resultColor, fontSize: scale(12) },
                            ]}
                          >
                            {resultText}
                          </CustomText>
                        </View>
                        <CustomText
                          style={[
                            styles.historyDate,
                            { color: colors.text + "60", fontSize: scale(11) },
                          ]}
                        >
                          {formatDate(history.played_at)}
                        </CustomText>
                      </View>
                      <CustomText
                        style={[
                          styles.historyPoints,
                          {
                            color: colors.primary,
                            fontSize: scale(14),
                            fontWeight: "bold",
                          },
                        ]}
                      >
                        +{playerPoints} puan
                      </CustomText>
                    </View>

                    <View style={styles.historyPlayers}>
                      <View style={styles.historyPlayer}>
                        <Image
                          source={getAvatarSource(opponent?.avatar_index || 0)}
                          style={[
                            styles.historyAvatar,
                            {
                              width: scale(30),
                              height: scale(30),
                              borderRadius: scale(15),
                            },
                          ]}
                        />
                        <CustomText
                          style={[
                            styles.historyPlayerName,
                            { color: colors.text, fontSize: scale(14) },
                          ]}
                          numberOfLines={1}
                        >
                          {opponent?.username || "Rakip"}
                        </CustomText>
                      </View>

                      <View style={styles.historyScore}>
                        <CustomText
                          style={[
                            styles.historyScoreText,
                            {
                              color: colors.text,
                              fontSize: scale(16),
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {playerPieces} - {opponentPieces}
                        </CustomText>
                        <CustomText
                          style={[
                            styles.historyScoreLabel,
                            { color: colors.text + "60", fontSize: scale(10) },
                          ]}
                        >
                          Kule Parçası
                        </CustomText>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: scale(20) }} />
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: { fontWeight: "600", marginBottom: 16 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },
  statValue: { fontWeight: "bold", marginTop: 4 },
  statLabel: { fontWeight: "500" },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statsRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsRowLabel: { marginLeft: 4 },
  statsRowValue: { marginLeft: 4 },
  historyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: { textAlign: "center" },
  historyItem: {
    paddingVertical: 16,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultText: { fontWeight: "600" },
  historyDate: { fontWeight: "400" },
  historyPoints: { fontWeight: "bold" },
  historyPlayers: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyPlayer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  historyAvatar: { marginRight: 4 },
  historyPlayerName: { flex: 1 },
  historyScore: {
    alignItems: "center",
  },
  historyScoreText: { fontWeight: "bold" },
  historyScoreLabel: { fontWeight: "400" },
});
