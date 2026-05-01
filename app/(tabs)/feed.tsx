import AuthRequiredModal from "@components/AuthRequiredModal";
import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import CreatePostModal from "@components/Feed/CreatePostModal";
import FeedTabs from "@components/Feed/FeedTabs";
import PostItem from "@components/Feed/PostItem";
import PullToRefreshScroll from "@components/PullToRefreshScroll";
import { useAuth } from "@contexts/AuthContext";
import { useFollow } from "@contexts/FollowContext";
import { usePosts } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function FeedScreen() {
  const { user, profile } = useAuth();
  const { followingIds } = useFollow();
  const {
    posts,
    savedPosts,
    loading,
    refreshing,
    refreshPosts,
    likePost,
    unlikePost,
    sharePost,
    unsharePost,
    savePost,
    unsavePost,
    deletePost,
    quotePost,
  } = usePosts();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [activeTab, setActiveTab] = useState("explore");
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [followingPosts, setFollowingPosts] = useState<any[]>([]);

  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    if (posts.length > 0) {
      const filtered = posts.filter((post) => followingIds.has(post.user_id));
      setFollowingPosts(filtered);
    }
  }, [posts, followingIds]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const tabsTranslateY = useRef(new Animated.Value(0)).current;
  const [showTabs, setShowTabs] = useState(true);

  const handlePostPress = () => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    setCreatePostVisible(true);
  };

  const handleMessagePress = () => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    router.push("/messages");
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    if (isLiked) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
    }
  };

  const handleShare = async (postId: string, isShared: boolean) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    if (isShared) {
      await unsharePost(postId);
    } else {
      await sharePost(postId);
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    if (isSaved) {
      await unsavePost(postId);
    } else {
      await savePost(postId);
    }
  };

  const handleComment = (postId: string) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    console.log("Yorum butonuna tıklandı:", postId);
  };

  const handleMorePress = (postId: string) => {};

  const handleDelete = async (postId: string) => {
    const { error } = await deletePost(postId);
    if (error) {
      Alert.alert("Hata", "Gönderi silinirken bir hata oluştu");
    }
  };

  const handleQuote = async (postId: string, quoteText: string) => {
    if (!user) {
      setAuthModalVisible(true);
      return false;
    }
    const { error } = await quotePost(postId, quoteText);
    if (error) {
      Alert.alert("Hata", "Alıntı yapılırken bir hata oluştu");
      return false;
    }
    return true;
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const getFilteredPosts = useCallback(() => {
    // Giriş yapmamış kullanıcı hiçbir sekmede gönderi göremez
    if (!user) return [];

    switch (activeTab) {
      case "explore":
        return posts;
      case "following":
        return followingPosts;
      case "saved":
        return savedPosts;
      default:
        return posts;
    }
  }, [activeTab, posts, followingPosts, savedPosts, user]);

  const filteredPosts = getFilteredPosts();

  const statusBarHeight = isDesktop
    ? 0
    : Platform.OS === "ios"
      ? scale(40)
      : StatusBar.currentHeight || scale(20);

  const navbarHeight = scale(isDesktop ? 40 : 70);
  const tabsHeight = scale(isDesktop ? 36 : 50);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const delta = currentScrollY - lastScrollY.current;

        if (Math.abs(delta) > 5) {
          if (delta > 0 && currentScrollY > 50) {
            if (showTabs) {
              setShowTabs(false);
              Animated.timing(tabsTranslateY, {
                toValue: -tabsHeight,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          } else if (delta < 0) {
            if (!showTabs) {
              setShowTabs(true);
              Animated.timing(tabsTranslateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }
        }

        lastScrollY.current = currentScrollY;
      },
    },
  );

  const headerBorderRadius = tabsTranslateY.interpolate({
    inputRange: [-tabsHeight, 0],
    outputRange: [scale(16), 0],
    extrapolate: "clamp",
  });

  const tabs = [
    { key: "explore", label: "Keşfet" },
    { key: "following", label: "Takip Ettiklerin" },
    { key: "saved", label: "Kaydedilenler" },
  ];

  const getItemKey = (item: any) => {
    return `feed-${item.id}-${item.user_id}-${item.quote_text || "normal"}`;
  };

  const screenContent = (
    <>
      <Animated.View
        style={[
          styles.fixedNavbar,
          {
            height: navbarHeight,
            paddingTop: statusBarHeight,
            backgroundColor: colors.card,
            justifyContent: "center",
          },
          isDesktop && {
            borderBottomLeftRadius: headerBorderRadius,
            borderBottomRightRadius: headerBorderRadius,
          },
        ]}
      >
        <View style={styles.navbarContent}>
          <View
            style={[styles.navbarSide, { width: scale(isDesktop ? 28 : 40) }]}
          >
            <TouchableOpacity
              onPress={handlePostPress}
              style={[
                styles.iconContainer,
                {
                  width: scale(isDesktop ? 28 : 40),
                  height: scale(isDesktop ? 28 : 40),
                },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={scale(isDesktop ? 18 : 24)}
                color={colors.text || "#000000"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.navbarCenter}>
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 12 : 18),
                color: colors.text,
              }}
            >
              {user ? profile?.username || "Akış" : "Akış"}
            </CustomText>
          </View>

          <View
            style={[styles.navbarSide, { width: scale(isDesktop ? 28 : 40) }]}
          >
            <TouchableOpacity
              onPress={handleMessagePress}
              style={[
                styles.iconContainer,
                {
                  width: scale(isDesktop ? 28 : 40),
                  height: scale(isDesktop ? 28 : 40),
                },
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={scale(isDesktop ? 18 : 24)}
                color={colors.text || "#000000"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.tabsContainer,
          {
            transform: [{ translateY: tabsTranslateY }],
            top: navbarHeight,
            height: tabsHeight,
            backgroundColor: colors.card,
          },
          isDesktop && {
            borderBottomLeftRadius: scale(16),
            borderBottomRightRadius: scale(16),
            borderBottomWidth: 0,
          },
        ]}
      >
        <FeedTabs activeTab={activeTab} onTabPress={setActiveTab} tabs={tabs} />
      </Animated.View>

      <PullToRefreshScroll
        ref={scrollViewRef}
        onRefresh={refreshPosts}
        refreshing={refreshing}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        navbarHeight={navbarHeight + tabsHeight}
        contentContainerStyle={[
          styles.container,
          {
            padding: scale(isDesktop ? 20 : 16),
            paddingTop: navbarHeight + tabsHeight + scale(10),
            paddingBottom: scale(30),
          },
        ]}
      >
        {filteredPosts.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="newspaper-outline"
              size={scale(isDesktop ? 48 : 64)}
              color={colors.text + "40"}
            />
            <CustomText
              style={[
                styles.emptyText,
                {
                  fontSize: scale(isDesktop ? 10 : 16),
                  color: colors.text + "60",
                  marginTop: scale(16),
                  textAlign: "center",
                },
              ]}
            >
              {!user
                ? "Gönderileri görmek için giriş yapın."
                : activeTab === "saved"
                  ? "Henüz kaydedilmiş gönderiniz yok."
                  : activeTab === "following"
                    ? "Takip ettiğiniz kişilerin gönderileri burada görünecek."
                    : "Gönderi bulunamadı."}
            </CustomText>
            {activeTab === "explore" && user && (
              <TouchableOpacity
                style={[
                  styles.createButton,
                  {
                    backgroundColor: colors.primary,
                    paddingHorizontal: scale(20),
                    paddingVertical: scale(isDesktop ? 10 : 12),
                    borderRadius: scale(isDesktop ? 12 : 25),
                    marginTop: scale(20),
                  },
                ]}
                onPress={handlePostPress}
              >
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 10 : 16),
                    color: "white",
                  }}
                >
                  İlk Gönderiyi Paylaş
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.feed}>
            {filteredPosts.map((post) => (
              <PostItem
                key={getItemKey(post)}
                post={post}
                onLike={() => handleLike(post.id, post.user_liked)}
                onShare={() => handleShare(post.id, post.user_shared)}
                onSave={() => handleSave(post.id, post.user_saved)}
                onComment={() => handleComment(post.id)}
                onMorePress={() => handleMorePress(post.id)}
                onUserPress={handleUserPress}
                onDelete={() => handleDelete(post.id)}
                onQuote={handleQuote}
              />
            ))}
          </View>
        )}
      </PullToRefreshScroll>

      <CreatePostModal
        visible={createPostVisible}
        onClose={() => setCreatePostVisible(false)}
      />

      <AuthRequiredModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  tabsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  container: {
    flexGrow: 1,
  },
  feed: {
    marginBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  emptyText: {
    textAlign: "center",
  },
  createButton: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
