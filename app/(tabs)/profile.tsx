import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import PullToRefreshScroll from "@components/PullToRefreshScroll";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getBannerSource } from "@utils/bannerUtils";
import AvatarSection from "components/Profile/AvatarSection";
import BannerSection from "components/Profile/BannerSection";
import ProfileHeader from "components/Profile/ProfileHeader";
import ProfileTabs, { ProfileTabsRef } from "components/Profile/ProfileTabs";
import SettingsDrawer from "components/Profile/SettingsDrawer";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("gönderi");
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Seçili banner'ı tutan state
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(
    profile?.banner_index || 0,
  );

  // Seçili avatar'ı tutan state
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(
    profile?.avatar_index || 0,
  );

  // Satın alınan ürünler
  const [purchasedAvatars, setPurchasedAvatars] = useState<Set<number>>(
    new Set(),
  );
  const [purchasedBanners, setPurchasedBanners] = useState<Set<number>>(
    new Set(),
  );

  // Kullanıcının satın aldığı ürünleri getir
  const fetchUserPurchases = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_purchases")
        .select("item_type, item_index")
        .eq("user_id", user.id);

      if (error) throw error;

      const avatars = new Set<number>();
      const banners = new Set<number>();

      data?.forEach((item) => {
        if (item.item_type === "avatar") avatars.add(item.item_index);
        else if (item.item_type === "banner") banners.add(item.item_index);
      });

      setPurchasedAvatars(avatars);
      setPurchasedBanners(banners);
    } catch (error) {
      console.error("Satın alınan ürünler yüklenirken hata:", error);
    }
  };

  // Veritabanından profil bilgisi asenkron olarak yüklendiğinde anlık olarak arayüze yansıtması için
  useEffect(() => {
    if (profile) {
      setSelectedBannerIndex(profile.banner_index || 0);
      setSelectedAvatarIndex(profile.avatar_index || 0);
    }
    fetchUserPurchases();
  }, [profile?.banner_index, profile?.avatar_index, user]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const profileTabsRef = useRef<ProfileTabsRef>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await refreshProfile();
      await fetchUserPurchases();
      Alert.alert("✅ Sayfa Yenilendi", "Profil bilgileriniz güncellendi.");
    }
    setRefreshing(false);
  };

  const handleBannerChange = async (index: number) => {
    setSelectedBannerIndex(index);
    if (user) await updateProfile({ banner_index: index });
  };

  const handleAvatarChange = async (index: number) => {
    setSelectedAvatarIndex(index);
    if (user) await updateProfile({ avatar_index: index });
  };

  // Seçili banner
  const currentBanner = getBannerSource(selectedBannerIndex);

  // Banner opaklığı için interpolasyon
  const bannerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150, 200],
    outputRange: [1, 0.6, 0.3, 0],
    extrapolate: "clamp",
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 100, 150, 200],
    outputRange: [1, 0.9, 0.8, 0.7],
    extrapolate: "clamp",
  });

  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 80, 150, 200],
    outputRange: [1, 0.7, 0.4, 0.2],
    extrapolate: "clamp",
  });

  // Avatar konumu için interpolasyon - kaydırma ile yukarı çıkma
  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -40],
    extrapolate: "clamp",
  });

  // Navbar arka plan opacity - başlangıçta 1, kaydırınca 0
  const navbarBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  // Banner arka plan opacity - başlangıçta 0, kaydırınca 1
  const navbarBannerOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0.7, 1],
    extrapolate: "clamp",
  });

  // Beyaz ikonların opacity'si - başlangıçta 0, kaydırınca 1
  const whiteIconsOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  // Normal ikonların opacity'si - başlangıçta 1, kaydırınca 0
  const normalIconsOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const navbarBorderRadius = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0, scale(16)],
    extrapolate: "clamp",
  });

  const navbarHeight = scale(isDesktop ? 40 : 70);
  const statusBarHeight = isDesktop
    ? 0
    : Platform.OS === "ios"
      ? scale(40)
      : StatusBar.currentHeight || scale(20);

  const iconSize = scale(isDesktop ? 28 : 40);
  const textColor = colors?.text ? colors.text + "CC" : "#000000CC";

  const handleTabSelect = (tabIndex: number) => {
    profileTabsRef.current?.scrollToIndex(tabIndex);
  };

  const screenContent = (
    <>
      {/* Sabit Navbar */}
      <Animated.View
        style={[
          styles.fixedNavbar,
          {
            height: navbarHeight,
            paddingTop: statusBarHeight,
            justifyContent: isDesktop ? "center" : "flex-start",
          },
          isDesktop && {
            borderBottomLeftRadius: navbarBorderRadius,
            borderBottomRightRadius: navbarBorderRadius,
          },
        ]}
      >
        {/* Normal navbar arka planı */}
        <Animated.View
          style={[
            styles.navbarBackground,
            {
              backgroundColor: colors.card,
              opacity: navbarBackgroundOpacity,
            },
          ]}
        />

        {/* Banner arka planı */}
        <Animated.View
          style={[
            styles.navbarBannerBackground,
            {
              opacity: navbarBannerOpacity,
            },
          ]}
        >
          <ImageBackground
            source={currentBanner}
            style={styles.navbarBannerImage}
            resizeMode="cover"
            blurRadius={10}
          >
            <View style={styles.bannerOverlay} />
          </ImageBackground>
        </Animated.View>

        <View style={styles.navbarContent}>
          {/* Sol: Bildirim ikonu */}
          <View style={[styles.navbarSide, { width: iconSize }]}>
            <TouchableOpacity
              style={[
                styles.iconContainer,
                { width: iconSize, height: iconSize },
              ]}
            >
              <Animated.View style={{ opacity: normalIconsOpacity }}>
                <Ionicons
                  name="notifications-outline"
                  size={scale(isDesktop ? 18 : 24)}
                  color={colors.text || "#000000"}
                />
              </Animated.View>

              <Animated.View
                style={[styles.whiteIcon, { opacity: whiteIconsOpacity }]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={scale(isDesktop ? 18 : 24)}
                  color="white"
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Orta: Kullanıcı adı */}
          <View style={styles.navbarCenter}>
            {/* Normal renkli metin */}
            <Animated.View
              style={{ position: "absolute", opacity: normalIconsOpacity }}
            >
              <CustomText
                style={{
                  fontSize: scale(isDesktop ? 14 : 18),
                  fontWeight: "600",
                  color: colors.text,
                }}
              >
                {user ? profile?.username || "Profil" : "Misafir"}
              </CustomText>
            </Animated.View>

            {/* Beyaz metin */}
            <Animated.View
              style={{ position: "absolute", opacity: whiteIconsOpacity }}
            >
              <CustomText
                style={{
                  fontSize: scale(isDesktop ? 14 : 18),
                  fontWeight: "600",
                  color: "white",
                }}
              >
                {user ? profile?.username || "Profil" : "Misafir"}
              </CustomText>
            </Animated.View>
          </View>

          {/* Sağ: Menü ikonu */}
          <View style={[styles.navbarSide, { width: iconSize }]}>
            <TouchableOpacity
              onPress={() => setSettingsVisible(true)}
              style={[
                styles.iconContainer,
                { width: iconSize, height: iconSize },
              ]}
            >
              <Animated.View style={{ opacity: normalIconsOpacity }}>
                <Ionicons
                  name="menu-outline"
                  size={scale(isDesktop ? 18 : 24)}
                  color={colors.text || "#000000"}
                />
              </Animated.View>

              <Animated.View
                style={[styles.whiteIcon, { opacity: whiteIconsOpacity }]}
              >
                <Ionicons
                  name="menu-outline"
                  size={scale(isDesktop ? 18 : 24)}
                  color="white"
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <View style={{ flex: 1 }}>
        <PullToRefreshScroll
          onRefresh={onRefresh}
          refreshing={refreshing}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: navbarHeight,
            },
          ]}
        >
          <View style={styles.headerContainer}>
            <BannerSection
              scrollY={scrollY}
              bannerOpacity={bannerOpacity}
              selectedBannerIndex={selectedBannerIndex}
              onBannerChange={handleBannerChange}
              purchasedBanners={purchasedBanners}
            />

            <AvatarSection
              scrollY={scrollY}
              avatarScale={avatarScale}
              avatarOpacity={avatarOpacity}
              avatarTranslateY={avatarTranslateY}
              selectedAvatarIndex={selectedAvatarIndex}
              onAvatarChange={handleAvatarChange}
              purchasedAvatars={purchasedAvatars}
            />
          </View>

          <View
            style={[
              styles.contentContainer,
              { paddingTop: scale(isDesktop ? 50 : 60) },
            ]}
          >
            <ProfileHeader
              activeTab={activeTab}
              onTabPress={setActiveTab}
              onTabSelect={handleTabSelect}
            />

            <View style={{ marginTop: scale(12) }}>
              <CustomText
                style={[
                  styles.bioText,
                  {
                    color: textColor,
                    fontSize: scale(isDesktop ? 12 : 14),
                    lineHeight: scale(isDesktop ? 18 : 20),
                  },
                ]}
              >
                {user
                  ? profile?.bio ||
                    "Henüz bir biyografi eklenmemiş. Biyografinizi düzenlemek için ayarlara gidin."
                  : "Kendini tanıtmak ve diğer kullanıcılarla etkileşime geçmek için hemen giriş yap!"}
              </CustomText>
            </View>

            <View style={{ marginTop: scale(20) }}>
              <ProfileTabs
                ref={profileTabsRef}
                activeTab={activeTab}
                onTabPress={setActiveTab}
                onSwipe={setActiveTab}
              />
            </View>
          </View>
        </PullToRefreshScroll>
      </View>

      <SettingsDrawer
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );

  if (isDesktop) {
    return <View style={{ flex: 1 }}>{screenContent}</View>;
  }

  return (
    <BackgroundImage overlayOpacity={0.03}>{screenContent}</BackgroundImage>
  );
}

const styles = StyleSheet.create({
  fixedNavbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: "hidden",
  },
  navbarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navbarBannerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navbarBannerImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  navbarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  navbarSide: {
    alignItems: "center",
    justifyContent: "center",
  },
  navbarCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  whiteIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  headerContainer: {
    position: "relative",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bioText: {
    textAlign: "center",
  },
});
