import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import InvitationModal from "@components/Duel/InvitationModal";
import { useAuth } from "@contexts/AuthContext";
import { useDailyStreak } from "@contexts/DailyStreakContext";
import { useDuel } from "@contexts/DuelContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getAvatarSource } from "@utils/avatarUtils";
import { Redirect, router, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Tab bileşenlerini import et
import DictionaryScreen from "./dictionary";
import FeedScreen from "./feed";
import HomeScreen from "./index";
import ProfileScreen from "./profile";
import StoreScreen from "./store";

const { width: screenWidth } = Dimensions.get("window");

// Tab component'leri
const tabComponents = [
  {
    component: StoreScreen,
    name: "store",
    title: "Mağaza",
    icon: "bag" as const,
  },
  {
    component: DictionaryScreen,
    name: "dictionary",
    title: "Sözlük",
    icon: "list" as const,
  },
  {
    component: HomeScreen,
    name: "index",
    title: "Ana Sayfa",
    icon: "book-outline" as const,
  },
  {
    component: FeedScreen,
    name: "feed",
    title: "Akış",
    icon: "newspaper" as const,
  },
  {
    component: ProfileScreen,
    name: "profile",
    title: "Profil",
    icon: "person" as const,
  },
];

export default function TabsLayout() {
  const { user, initialized } = useAuth();
  const { colors, themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { scale, isDesktop } = useResponsive();
  const [activeIndex, setActiveIndex] = useState(2);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const navigationInProgress = useRef(false);
  const lastSessionId = useRef<string | null>(null);

  // 4 Aşamalı (Kademeli) Daralma Mantığı
  const showRightSidebar = isDesktop && width >= 1200;
  const isCompactLeftSidebar = isDesktop && width < 950;

  // Günlük Seri Context
  const {
    streakData,
    loading: streakLoading,
    refreshStreak,
  } = useDailyStreak();
  // Kullanıcı yoksa misafir için sıfır göster
  const dailyStreak = user ? streakData?.current_streak || 0 : 0;
  const completedTasks = user ? 12 : 0; // Geçici Örnek Veri

  // Düello davetleri
  const { pendingRequests, activeSession } = useDuel();
  const [invitationVisible, setInvitationVisible] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<any>(null);

  // Aylık Liderlik (Sağ Kenar Çubuğu İçin)
  const [leaderboardMode, setLeaderboardMode] = useState<"duel" | "practice">(
    "duel",
  );
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Gelen davetleri kontrol et
  useEffect(() => {
    if (pendingRequests && pendingRequests.length > 0) {
      const latestRequest = pendingRequests[0];
      if (latestRequest.status === "pending") {
        setCurrentInvitation(latestRequest);
        setInvitationVisible(true);
      }
    }
  }, [pendingRequests]);

  // Aktif düello oturumu varsa session sayfasına yönlendir
  useEffect(() => {
    if (!activeSession) return;

    const shouldRedirect =
      activeSession.status === "countdown" ||
      activeSession.status === "ongoing";

    if (
      shouldRedirect &&
      !pathname.includes("/duel/session") &&
      !navigationInProgress.current
    ) {
      if (lastSessionId.current === activeSession.id) {
        return;
      }

      navigationInProgress.current = true;
      lastSessionId.current = activeSession.id;
      console.log(
        "🎮 Aktif düello oturumu bulundu, session sayfasına yönlendiriliyor",
      );

      router.replace("/duel/session");

      setTimeout(() => {
        navigationInProgress.current = false;
      }, 1000);
    }
  }, [activeSession, pathname]);

  // Bilgisayarda isek aylık liderlik tablosunu çek
  useEffect(() => {
    if (isDesktop && showRightSidebar) {
      fetchMonthlyLeaderboard();
    }
  }, [isDesktop, showRightSidebar, leaderboardMode]);

  // Aylık liderlik verisini Supabase'den çek
  const fetchMonthlyLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM" formatı
      const sortColumn =
        leaderboardMode === "duel" ? "duel_trophies" : "practice_score";

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
        .limit(7);

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
            leaderboardMode === "duel"
              ? item.duel_trophies
              : item.practice_score,
        }));

        // Puanı 0 olanları hariç tut
        setLeaderboardData(mappedData.filter((m) => m.points > 0));
      }
    } catch (err) {
      console.error("Beklenmeyen hata:", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  if (!initialized) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <CustomText>Yükleniyor...</CustomText>
      </View>
    );
  }

  // MİSAFİR GİRİŞİNİ ENGELLEYEN Redirect KALDIRILDI!
  // Yalnızca kullanıcı giriş yapmış ancak e-postasını doğrulamamışsa yönlendir.
  if (user && !user.email_confirmed_at) {
    return <Redirect href="/verify-email" />;
  }

  const handleSwipe = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    if (!isDesktop) {
      scrollViewRef.current?.scrollTo({ x: width * index, animated: true });
    }
  };

  const tabBarBackgroundColor =
    themeMode === "dark" ? colors.card + "DD" : colors.card + "FF";

  // İstenen menü sırası: Profil (4), Akış (3), Ana sayfa (2), Sözlük (1), Mağaza (0)
  const desktopMenuOrder = [4, 3, 2, 1, 0];

  const layoutContent = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDesktop ? "transparent" : colors.background,
          flexDirection: isDesktop ? "row" : "column",
        },
      ]}
    >
      {/* MASAÜSTÜ SOL KENAR ÇUBUĞU */}
      {isDesktop && (
        <View
          style={[
            styles.leftSidebar,
            { borderColor: colors.border, backgroundColor: "transparent" },
            isCompactLeftSidebar && {
              width: 90,
              paddingHorizontal: 10,
              alignItems: "center",
            },
          ]}
        >
          <CustomText
            style={[
              styles.logoText,
              { color: colors.primary },
              isCompactLeftSidebar && {
                paddingLeft: 0,
                textAlign: "center",
                fontSize: 44,
              },
            ]}
          >
            {isCompactLeftSidebar ? "E" : "Etimografia"}
          </CustomText>

          <View
            style={[
              styles.menuItems,
              isCompactLeftSidebar && { alignItems: "center", width: "100%" },
            ]}
          >
            {desktopMenuOrder.map((index) => {
              const tab = tabComponents[index];
              const isActive = activeIndex === index;
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={[
                    styles.sidebarItem,
                    isActive && { backgroundColor: colors.primary + "15" },
                    isCompactLeftSidebar && {
                      justifyContent: "center",
                      paddingHorizontal: 0,
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      gap: 0,
                    },
                  ]}
                  onPress={() => handleTabPress(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sidebarIconWrapper}>
                    <Ionicons
                      name={tab.icon}
                      size={isCompactLeftSidebar ? 30 : 28}
                      color={isActive ? colors.primary : colors.text}
                    />
                  </View>
                  {!isCompactLeftSidebar && (
                    <CustomText
                      style={[
                        styles.sidebarItemText,
                        {
                          color: isActive ? colors.primary : colors.text,
                          fontWeight: isActive ? "bold" : "500",
                        },
                      ]}
                    >
                      {tab.title}
                    </CustomText>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.sidebarItem,
                isCompactLeftSidebar && {
                  justifyContent: "center",
                  paddingHorizontal: 0,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  gap: 0,
                },
              ]}
              onPress={() => router.push("/duel/statistics")}
              activeOpacity={0.7}
            >
              <View style={styles.sidebarIconWrapper}>
                <Ionicons
                  name="analytics"
                  size={isCompactLeftSidebar ? 30 : 28}
                  color={colors.text}
                />
              </View>
              {!isCompactLeftSidebar && (
                <CustomText
                  style={[
                    styles.sidebarItemText,
                    { color: colors.text, fontWeight: "500" },
                  ]}
                >
                  İstatistik
                </CustomText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sidebarItem,
                isCompactLeftSidebar && {
                  justifyContent: "center",
                  paddingHorizontal: 0,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  gap: 0,
                },
              ]}
              onPress={() => router.push("/duel/heroes")}
              activeOpacity={0.7}
            >
              <View style={styles.sidebarIconWrapper}>
                <FontAwesome5
                  name="crown"
                  size={isCompactLeftSidebar ? 26 : 24}
                  color={colors.text}
                />
              </View>
              {!isCompactLeftSidebar && (
                <CustomText
                  style={[
                    styles.sidebarItemText,
                    { color: colors.text, fontWeight: "500" },
                  ]}
                >
                  Kahraman
                </CustomText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sidebarItem,
                isCompactLeftSidebar && {
                  justifyContent: "center",
                  paddingHorizontal: 0,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  gap: 0,
                },
              ]}
              onPress={() => router.push("/duel/leaderboard")}
              activeOpacity={0.7}
            >
              <View style={styles.sidebarIconWrapper}>
                <Ionicons
                  name="trophy"
                  size={isCompactLeftSidebar ? 30 : 28}
                  color={colors.text}
                />
              </View>
              {!isCompactLeftSidebar && (
                <CustomText
                  style={[
                    styles.sidebarItemText,
                    { color: colors.text, fontWeight: "500" },
                  ]}
                >
                  Liderlik
                </CustomText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ORTA ANA İÇERİK */}
      <View
        style={[
          styles.mainContentWrapper,
          isDesktop && { maxWidth: 650, marginHorizontal: 20 },
        ]}
      >
        {isDesktop ? (
          <View style={{ flex: 1 }}>
            {tabComponents.map((tab, index) => (
              <View
                key={tab.name}
                style={{
                  flex: 1,
                  display: activeIndex === index ? "flex" : "none",
                }}
              >
                <tab.component />
              </View>
            ))}
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleSwipe}
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentOffset={{ x: width * 2, y: 0 }}
          >
            {tabComponents.map((tab, index) => (
              <View key={tab.name} style={{ width, flex: 1 }}>
                <tab.component />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* MASAÜSTÜ SAĞ KENAR ÇUBUĞU - 1200px altına inilirse sağ kolon gizlenir */}
      {isDesktop && showRightSidebar && (
        <View
          style={[
            styles.rightSidebar,
            { borderColor: colors.border, backgroundColor: "transparent" },
          ]}
        >
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            {/* Günlük Seri */}
            <TouchableOpacity
              style={[
                styles.rightTopBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
              onPress={() => user && refreshStreak()}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Ionicons name="flame" size={24} color="#FF6B6B" />
                <CustomText
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  {streakLoading && user ? "..." : dailyStreak}
                </CustomText>
              </View>
              <CustomText
                style={{
                  color: colors.text + "80",
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                GÜN SERİSİ
              </CustomText>
            </TouchableOpacity>

            {/* Görevler */}
            <TouchableOpacity
              style={[
                styles.rightTopBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
                <CustomText
                  style={{
                    color: colors.primary,
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  {completedTasks}
                </CustomText>
              </View>
              <View
                style={{
                  width: "70%",
                  height: 6,
                  backgroundColor: colors.text + "20",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${(completedTasks / 30) * 100}%`,
                    height: "100%",
                    backgroundColor: colors.primary,
                    borderRadius: 3,
                  }}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Aylık Liderlik Alanı ve Kutu İçi Seçim Menüsü */}
          <View
            style={[
              styles.leaderboardCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <CustomText
                style={[
                  styles.rightSidebarTitle,
                  { color: colors.text, marginBottom: 0 },
                ]}
              >
                Sıralama
              </CustomText>

              {/* Mod Seçici Küçük Kutu */}
              <View
                style={[
                  styles.miniSwitcher,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.miniSwitcherButton,
                    leaderboardMode === "duel" && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => setLeaderboardMode("duel")}
                  activeOpacity={0.8}
                >
                  <CustomText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color:
                        leaderboardMode === "duel"
                          ? "white"
                          : colors.text + "80",
                    }}
                  >
                    Düello
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.miniSwitcherButton,
                    leaderboardMode === "practice" && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => setLeaderboardMode("practice")}
                  activeOpacity={0.8}
                >
                  <CustomText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color:
                        leaderboardMode === "practice"
                          ? "white"
                          : colors.text + "80",
                    }}
                  >
                    Pratik
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {leaderboardLoading ? (
              <CustomText
                style={{
                  color: colors.text + "80",
                  textAlign: "center",
                  marginTop: 20,
                  marginBottom: 20,
                }}
              >
                Yükleniyor...
              </CustomText>
            ) : leaderboardData.length > 0 ? (
              leaderboardData.map((player, idx, arr) => (
                <View
                  key={player.user_id}
                  style={[
                    styles.leaderboardItem,
                    { borderBottomColor: colors.border },
                    idx === arr.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <CustomText
                    style={[
                      styles.leaderboardRank,
                      { color: idx < 3 ? colors.primary : colors.text + "80" },
                    ]}
                  >
                    {idx + 1}
                  </CustomText>
                  <Image
                    source={getAvatarSource(player.avatar_index || 0)}
                    style={styles.leaderboardAvatar}
                  />
                  <View style={styles.leaderboardInfo}>
                    <CustomText
                      style={[styles.leaderboardName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {player.username}
                    </CustomText>
                    <CustomText
                      style={[
                        styles.leaderboardPoints,
                        { color: colors.primary },
                      ]}
                    >
                      {player.points}{" "}
                      {leaderboardMode === "duel" ? "Kupa" : "Puan"}
                    </CustomText>
                  </View>
                </View>
              ))
            ) : (
              <CustomText
                style={{
                  color: colors.text + "80",
                  textAlign: "center",
                  marginTop: 20,
                  marginBottom: 20,
                }}
              >
                Henüz veri yok
              </CustomText>
            )}

            <TouchableOpacity
              style={{ marginTop: 12, alignItems: "center" }}
              onPress={() => router.push("/duel/leaderboard")}
            >
              <CustomText
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Tümünü Gör
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* MİSAFİR KULLANICILAR İÇİN GİRİŞ YAP KUTUSU */}
          {!user && (
            <TouchableOpacity
              style={[
                styles.loginActionBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => router.push("/(auth)")}
            >
              <View
                style={[
                  styles.loginActionIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name="log-in" size={24} color={colors.primary} />
              </View>
              <CustomText
                style={[styles.loginActionTitle, { color: colors.text }]}
              >
                Daha Fazlasını Keşfet
              </CustomText>
              <CustomText
                style={[styles.loginActionDesc, { color: colors.text + "80" }]}
              >
                İlerlemeni kaydetmek ve sıralamaya girmek için hemen giriş yap.
              </CustomText>
              <View
                style={[
                  styles.loginActionButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <CustomText style={styles.loginActionButtonText}>
                  Giriş Yap / Kayıt Ol
                </CustomText>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* MOBİL ALT TAB BAR */}
      {!isDesktop && (
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: tabBarBackgroundColor,
              paddingBottom: insets.bottom > 0 ? insets.bottom : scale(10),
              height:
                scale(50) + (insets.bottom > 0 ? insets.bottom : scale(10)),
              borderTopWidth: 0,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -3 },
                  shadowOpacity: themeMode === "dark" ? 0.3 : 0.1,
                  shadowRadius: 8,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: themeMode === "dark" ? "#333" : "#e0e0e0",
                },
                android: {
                  elevation: themeMode === "dark" ? 12 : 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: themeMode === "dark" ? 0.2 : 0.05,
                  shadowRadius: 4,
                },
              }),
            },
          ]}
        >
          {tabComponents.map((tab, index) => (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.tabItem,
                {
                  paddingVertical: scale(8),
                },
              ]}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={scale(24)}
                color={
                  activeIndex === index ? colors.primary : colors.text + "80"
                }
              />
              <CustomText
                style={[
                  styles.tabText,
                  {
                    fontSize: scale(10),
                    color:
                      activeIndex === index
                        ? colors.primary
                        : colors.text + "80",
                  },
                ]}
              >
                {tab.title}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Düello Davet Modalı */}
      <InvitationModal
        visible={invitationVisible}
        request={currentInvitation}
        onClose={() => {
          setInvitationVisible(false);
        }}
      />
    </View>
  );

  if (isDesktop) {
    return (
      <BackgroundImage overlayOpacity={0.03}>{layoutContent}</BackgroundImage>
    );
  }

  return layoutContent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Masaüstü Sol Kenar Çubuğu Stilleri
  leftSidebar: {
    width: 250,
    padding: 20,
    paddingTop: 40,
    borderRightWidth: 1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    paddingLeft: 10,
  },
  menuItems: {
    flex: 1,
    gap: 4,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
  },
  sidebarIconWrapper: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarItemText: {
    fontSize: 18,
  },
  // Orta Ana İçerik Stilleri
  mainContentWrapper: {
    flex: 1,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  // Masaüstü Sağ Kenar Çubuğu Stilleri
  rightSidebar: {
    width: 360,
    padding: 20,
    paddingTop: 40,
    borderLeftWidth: 1,
  },
  rightTopBox: {
    flex: 1,
    height: 85,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leaderboardCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rightSidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  miniSwitcher: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  miniSwitcherButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  leaderboardRank: {
    fontSize: 18,
    fontWeight: "bold",
    width: 24,
    textAlign: "center",
  },
  leaderboardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  leaderboardPoints: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Masaüstü Giriş Yap Kutusu Stilleri
  loginActionBox: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  loginActionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  loginActionDesc: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  loginActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  loginActionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  // Mobil Alt Çubuk Stilleri
  tabBar: {
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontWeight: "500",
  },
});
