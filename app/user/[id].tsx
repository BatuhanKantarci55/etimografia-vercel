import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import FollowButton from "@components/Profile/FollowButton";
import PullToRefreshScroll from "@components/PullToRefreshScroll";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import UserAvatarSection from "components/Profile/UserAvatarSection";
import UserBannerSection from "components/Profile/UserBannerSection";
import UserProfileHeader from "components/Profile/UserProfileHeader";
import UserProfileTabs from "components/Profile/UserProfileTabs";
import { router, useLocalSearchParams } from "expo-router";
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

// Banner görsellerini import et
const allBanners = [
  require("../../assets/images/banners/stars.png"),
  require("../../assets/images/banners/medusa.png"),
  require("../../assets/images/banners/pegasus.png"),
  require("../../assets/images/banners/roses.png"),
  require("../../assets/images/banners/red_castle.png"),
  require("../../assets/images/banners/desert.png"),
  require("../../assets/images/banners/eagle.png"),
  require("../../assets/images/banners/fairy.png"),
  require("../../assets/images/banners/fall.png"),
  require("../../assets/images/banners/flowers.png"),
  require("../../assets/images/banners/forest.png"),
  require("../../assets/images/banners/leaves.png"),
  require("../../assets/images/banners/mountains.png"),
  require("../../assets/images/banners/ocean.png"),
  require("../../assets/images/banners/orchid.png"),
  require("../../assets/images/banners/peacock.png"),
  require("../../assets/images/banners/phoenix.png"),
  require("../../assets/images/banners/space.png"),
  require("../../assets/images/banners/tree.png"),
  require("../../assets/images/banners/wolf.png"),
];

// Avatar görsellerini import et
const allAvatars = [
  require("../../assets/images/avatars/cat1.jpg"),
  require("../../assets/images/avatars/cat2.jpg"),
  require("../../assets/images/avatars/chicken1.png"),
  require("../../assets/images/avatars/cockatiel1.png"),
  require("../../assets/images/avatars/cow1.png"),
  require("../../assets/images/avatars/dolphin1.jpg"),
  require("../../assets/images/avatars/donkey1.png"),
  require("../../assets/images/avatars/duck1.png"),
  require("../../assets/images/avatars/elephant1.jpg"),
  require("../../assets/images/avatars/fox1.png"),
  require("../../assets/images/avatars/horse1.png"),
  require("../../assets/images/avatars/jellyfish1.jpg"),
  require("../../assets/images/avatars/kakadu1.png"),
  require("../../assets/images/avatars/octopus1.jpg"),
  require("../../assets/images/avatars/penguen1.jpg"),
  require("../../assets/images/avatars/penguen2.jpg"),
  require("../../assets/images/avatars/pigeon1.png"),
  require("../../assets/images/avatars/polarbear1.jpg"),
  require("../../assets/images/avatars/sheep1.png"),
];

type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_index: number;
  banner_index: number;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
};

export default function UserProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("gönderi");
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      setIsOwnProfile(user?.id === userId);
    }
  }, [userId, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          username,
          full_name,
          bio,
          avatar_index,
          banner_index
        `,
        )
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      let isFollowing = false;
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .maybeSingle();

        isFollowing = !!followData;
      }

      setProfile({
        ...profileData,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        posts_count: postsCount || 0,
        is_following: isFollowing,
      });
    } catch (error) {
      console.error("Profil bilgileri alınamadı:", error);
      Alert.alert("Hata", "Kullanıcı profili yüklenirken bir hata oluştu.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  const handleFollowChange = (newFollowState: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        is_following: newFollowState,
        followers_count: newFollowState
          ? profile.followers_count + 1
          : Math.max(0, profile.followers_count - 1),
      });
    }
  };

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

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -40],
    extrapolate: "clamp",
  });

  const navbarBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const navbarBannerOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0.7, 1],
    extrapolate: "clamp",
  });

  const whiteIconsOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  const normalIconsOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const navbarHeight = Platform.OS === "ios" ? scale(90) : scale(70);
  const statusBarHeight =
    Platform.OS === "ios" ? scale(40) : StatusBar.currentHeight || scale(20);
  const iconSize = scale(40);

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <CustomText>Profil yükleniyor...</CustomText>
        </View>
      </BackgroundImage>
    );
  }

  if (!profile) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <CustomText>Kullanıcı bulunamadı.</CustomText>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: scale(20) }}
          >
            <CustomText style={{ color: colors.primary }}>Geri Dön</CustomText>
          </TouchableOpacity>
        </View>
      </BackgroundImage>
    );
  }

  const currentBanner = allBanners[profile.banner_index || 0];

  return (
    <BackgroundImage overlayOpacity={0.03}>
      {/* Sabit Navbar */}
      <Animated.View
        style={[
          styles.fixedNavbar,
          {
            height: navbarHeight,
            paddingTop: statusBarHeight,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.navbarBackground,
            {
              backgroundColor: colors.card,
              opacity: navbarBackgroundOpacity,
            },
          ]}
        />

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
          {/* Sol: Geri butonu */}
          <View style={[styles.navbarSide, { width: iconSize }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.iconContainer,
                { width: iconSize, height: iconSize },
              ]}
            >
              <Animated.View style={{ opacity: normalIconsOpacity }}>
                <Ionicons
                  name="arrow-back"
                  size={scale(24)}
                  color={colors.text || "#000000"}
                />
              </Animated.View>
              <Animated.View
                style={[styles.whiteIcon, { opacity: whiteIconsOpacity }]}
              >
                <Ionicons name="arrow-back" size={scale(24)} color="white" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Orta: Kullanıcı adı - HER ZAMAN GÖRÜNÜR */}
          <View style={styles.navbarCenter}>
            <CustomText
              style={{
                fontSize: scale(18),
                fontWeight: "600",
                color: "white",
              }}
            >
              {profile.username}
            </CustomText>
          </View>

          {/* Sağ: Takip butonu (kendi profilimiz değilse) */}
          <View style={[styles.navbarSide, { width: iconSize }]}>
            {!isOwnProfile && (
              <FollowButton
                userId={profile.id}
                isFollowing={profile.is_following}
                onFollowChange={handleFollowChange}
                size="small"
              />
            )}
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
            <UserBannerSection
              scrollY={scrollY}
              bannerOpacity={bannerOpacity}
              bannerIndex={profile.banner_index || 0}
            />

            <UserAvatarSection
              scrollY={scrollY}
              avatarScale={avatarScale}
              avatarOpacity={avatarOpacity}
              avatarTranslateY={avatarTranslateY}
              avatarIndex={profile.avatar_index || 0}
            />
          </View>

          <View style={[styles.contentContainer, { paddingTop: scale(60) }]}>
            <UserProfileHeader
              profile={profile}
              activeTab={activeTab}
              onTabPress={setActiveTab}
            />

            <View style={{ marginTop: scale(12) }}>
              <CustomText
                style={[
                  styles.bioText,
                  {
                    color: colors.text + "CC",
                    fontSize: scale(14),
                    lineHeight: scale(20),
                  },
                ]}
              >
                {profile.bio || "Bu kullanıcı henüz bir biyografi eklememiş."}
              </CustomText>
            </View>

            <View style={{ marginTop: scale(20) }}>
              <UserProfileTabs
                userId={profile.id}
                activeTab={activeTab}
                onTabPress={setActiveTab}
              />
            </View>
          </View>
        </PullToRefreshScroll>
      </View>
    </BackgroundImage>
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
    minHeight: 120,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bioText: {
    textAlign: "center",
  },
});
