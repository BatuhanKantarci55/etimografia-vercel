import AuthRequiredModal from "@components/AuthRequiredModal";
import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import CreatePostModal from "@components/Feed/CreatePostModal";
import FeedTabs from "@components/Feed/FeedTabs";
import PostItem from "@components/Feed/PostItem";
import { useAuth } from "@contexts/AuthContext";
import { useComments } from "@contexts/CommentContext";
import { useFollow } from "@contexts/FollowContext";
import { usePosts } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getAvatarSource } from "@utils/avatarUtils";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

const PostDetail = ({
  post,
  onPostPressNav,
  getHandlers,
  navbarHeight,
  colors,
  scale,
  isDesktop,
}: any) => {
  const {
    comments,
    fetchComments,
    loading,
    toggleReplies,
    likeComment,
    unlikeComment,
  } = useComments();

  useEffect(() => {
    if (post?.id) fetchComments(post.id);
  }, [post?.id]);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 1) return "Şimdi";
      if (diffMins < 60) return `${diffMins} dk önce`;
      if (diffHours < 24) return `${diffHours} saat önce`;
      if (diffDays < 7) return `${diffDays} gün önce`;
      return date.toLocaleDateString("tr-TR");
    } catch (error) {
      return dateString;
    }
  };

  const handlers = getHandlers(post);

  const handleLikeComment = async (comment: any) => {
    if (comment.user_liked) {
      await unlikeComment(comment.id);
    } else {
      await likeComment(comment.id);
    }
  };

  const renderCommentContent = (content: string) => {
    const mentionRegex = /^(@\w+)/;
    const match = content.match(mentionRegex);

    if (match) {
      const mention = match[1];
      const restText = content.substring(mention.length).trim();

      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <CustomText
            fontFamily="regular"
            style={{
              fontSize: scale(isDesktop ? 10 : 13),
              color: colors.primary,
            }}
          >
            {mention}{" "}
          </CustomText>
          <CustomText
            fontFamily="regular"
            style={{
              fontSize: scale(isDesktop ? 10 : 13),
              color: colors.text,
            }}
          >
            {restText}
          </CustomText>
        </View>
      );
    }

    return (
      <CustomText
        fontFamily="regular"
        style={{
          fontSize: scale(isDesktop ? 10 : 13),
          color: colors.text,
        }}
      >
        {content}
      </CustomText>
    );
  };

  const renderReply = (reply: any) => (
    <View
      key={reply.id}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: scale(isDesktop ? 8 : 12),
      }}
    >
      <Image
        source={getAvatarSource(reply.user.avatar_index)}
        style={{
          width: scale(isDesktop ? 16 : 28),
          height: scale(isDesktop ? 16 : 28),
          borderRadius: scale(isDesktop ? 8 : 14),
          marginRight: scale(8),
        }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: scale(2),
          }}
        >
          <CustomText
            style={{
              fontWeight: "600",
              fontSize: scale(isDesktop ? 10 : 13),
              color: colors.text,
            }}
          >
            {reply.user.username}
          </CustomText>
          <CustomText
            style={{
              fontSize: scale(isDesktop ? 8 : 11),
              color: colors.text + "60",
              marginLeft: scale(8),
            }}
          >
            {formatTime(reply.created_at)}
          </CustomText>
        </View>

        {renderCommentContent(reply.content)}

        {reply.replies && reply.replies.length > 0 && (
          <View style={{ marginTop: scale(4) }}>
            {reply.replies.map((nestedReply: any) => renderReply(nestedReply))}
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => handleLikeComment(reply)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ alignItems: "center", marginLeft: scale(12) }}
      >
        <Ionicons
          name={reply.user_liked ? "heart" : "heart-outline"}
          size={scale(isDesktop ? 10 : 14)}
          color={reply.user_liked ? "#FF3B30" : colors.text + "60"}
        />
        {reply.likes_count > 0 && (
          <CustomText
            style={{
              fontSize: scale(isDesktop ? 8 : 10),
              color: colors.text + "60",
              marginTop: scale(2),
            }}
          >
            {reply.likes_count}
          </CustomText>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderComment = (item: any) => {
    const totalReplies = item.replies_count || 0;

    return (
      <View
        key={item.id}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: scale(16),
          paddingHorizontal: scale(12),
        }}
      >
        <Image
          source={getAvatarSource(item.user.avatar_index)}
          style={{
            width: scale(isDesktop ? 20 : 36),
            height: scale(isDesktop ? 20 : 36),
            borderRadius: scale(18),
            marginRight: scale(8),
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: scale(2),
            }}
          >
            <CustomText
              style={{
                fontWeight: "600",
                fontSize: scale(isDesktop ? 10 : 13),
                color: colors.text,
              }}
            >
              {item.user.username}
            </CustomText>
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 8 : 11),
                color: colors.text + "60",
                marginLeft: scale(8),
              }}
            >
              {formatTime(item.created_at)}
            </CustomText>
          </View>

          {renderCommentContent(item.content)}

          {totalReplies > 0 && (
            <View style={{ marginTop: scale(8) }}>
              <TouchableOpacity
                onPress={() => toggleReplies(item.id)}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Ionicons
                  name={item.show_replies ? "chevron-up" : "chevron-down"}
                  size={scale(isDesktop ? 8 : 16)}
                  color={colors.primary}
                />
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 8 : 12),
                    color: colors.primary,
                    marginLeft: scale(4),
                    fontWeight: "500",
                  }}
                >
                  {item.show_replies
                    ? "Yanıtları gizle"
                    : `${totalReplies} yanıtı göster`}
                </CustomText>
              </TouchableOpacity>

              {item.show_replies && item.replies && (
                <View style={{ marginTop: scale(4) }}>
                  {item.replies.map((reply: any) => renderReply(reply))}
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handleLikeComment(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ alignItems: "center", marginLeft: scale(12) }}
        >
          <Ionicons
            name={item.user_liked ? "heart" : "heart-outline"}
            size={scale(isDesktop ? 12 : 16)}
            color={item.user_liked ? "#FF3B30" : colors.text + "60"}
          />
          {item.likes_count > 0 && (
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 8 : 10),
                color: colors.text + "60",
                marginTop: scale(2),
              }}
            >
              {item.likes_count}
            </CustomText>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: navbarHeight + scale(10),
        paddingBottom: scale(100),
        paddingHorizontal: scale(isDesktop ? 20 : 16),
      }}
    >
      {/* DÜZELTME: key={post.id} eklendi. Geri dönüşte yeni durumla sıfırlanmasını (leakage önleme) garantiler. */}
      <PostItem
        key={post.id}
        post={post}
        onPostPress={onPostPressNav}
        {...handlers}
      >
        {comments.length > 0 && (
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.text + "20",
              paddingTop: scale(12),
              marginTop: scale(4),
            }}
          >
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 12 : 14),
                fontWeight: "bold",
                color: colors.text,
                marginBottom: scale(12),
                paddingHorizontal: scale(12),
              }}
            >
              Yorumlar
            </CustomText>
            {comments.map(renderComment)}
          </View>
        )}
        {loading && (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: scale(20) }}
          />
        )}
        {!loading && comments.length === 0 && (
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.text + "20",
              paddingTop: scale(12),
              marginTop: scale(4),
            }}
          >
            <CustomText
              style={{
                textAlign: "center",
                color: colors.text + "80",
                marginVertical: scale(12),
                fontSize: scale(isDesktop ? 10 : 13),
              }}
            >
              Henüz yorum yok. İlk yorumu sen yap!
            </CustomText>
          </View>
        )}
      </PostItem>
    </ScrollView>
  );
};

export default function FeedScreen() {
  const { user, profile } = useAuth();
  const { followingIds } = useFollow();
  const {
    posts,
    savedPosts,
    loading,
    refreshPosts,
    likePost,
    unlikePost,
    sharePost,
    unsharePost,
    savePost,
    unsavePost,
    deletePost,
    quotePost,
  } = usePosts() as any;

  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [activeTab, setActiveTab] = useState("explore");
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [followingPosts, setFollowingPosts] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const [postStack, setPostStack] = useState<any[]>([]);

  const flatListRef = useRef<any>(null);

  useEffect(() => {
    if (posts.length > 0) {
      const filtered = posts.filter((post: any) =>
        followingIds.has(post.user_id),
      );
      setFollowingPosts(filtered);
    }
  }, [posts, followingIds]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (localRefreshing) {
      timeoutId = setTimeout(() => {
        setLocalRefreshing(false);
      }, 4000);
    }
    return () => clearTimeout(timeoutId);
  }, [localRefreshing]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const tabsTranslateY = useRef(new Animated.Value(0)).current;
  const [showTabs, setShowTabs] = useState(true);

  // DÜZELTME: İç İçe Alıntılarda Eksik Bilgilerin Çekilmesi
  const handlePostPressNav = useCallback(
    async (postToOpen: any) => {
      let finalPost = { ...postToOpen };

      const existingPost =
        posts.find((p: any) => p.id === postToOpen.id) ||
        savedPosts.find((p: any) => p.id === postToOpen.id);

      if (existingPost) {
        finalPost = { ...existingPost };
      } else if (user && finalPost.user_liked === undefined) {
        // Eğer alıntı içerisinden açılmışsa ve 'user_liked' verisi eksikse kullanıcı istatistikleri dahil edilir
        try {
          const [liked, shared, saved] = await Promise.all([
            supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", finalPost.id)
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("post_shares")
              .select("id")
              .eq("post_id", finalPost.id)
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("post_saves")
              .select("id")
              .eq("post_id", finalPost.id)
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);
          finalPost.user_liked = !!liked.data;
          finalPost.user_shared = !!shared.data;
          finalPost.user_saved = !!saved.data;
        } catch (error) {
          console.error("Kullanıcı eylem istatistikleri çekilemedi:", error);
        }
      }

      setPostStack((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].id === finalPost.id) {
          return prev;
        }
        return [...prev, finalPost];
      });

      if (finalPost.quoted_post_id && !finalPost.quoted_post) {
        try {
          const { data } = await supabase
            .from("post_stats")
            .select("*")
            .eq("id", finalPost.quoted_post_id)
            .single();

          if (data) {
            setPostStack((prev) => {
              const newStack = [...prev];
              const idx = newStack.findIndex((p) => p.id === finalPost.id);
              if (idx !== -1) {
                newStack[idx] = { ...newStack[idx], quoted_post: data };
              }
              return newStack;
            });
          }
        } catch (error) {
          console.error("İç içe alıntı yüklenirken hata:", error);
        }
      }
    },
    [posts, savedPosts, user],
  );

  const handleBackPress = useCallback(() => {
    setPostStack((prev) => prev.slice(0, -1));
  }, []);

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

  // DÜZELTME: A (veya B) gönderisi beğenildiğinde, stack'teki açık olan gönderinin bilgilerinin anında güncellenmesi sağlandı.
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }

    // Optimizasyon ve Yığın Senkronizasyonu (A için atılan beğeni Stack'te kalır)
    setPostStack((prev) =>
      prev.map((p) => {
        let updated = { ...p };
        if (p.id === postId) {
          updated.user_liked = !isLiked;
          updated.likes_count = Math.max(
            0,
            (p.likes_count || 0) + (!isLiked ? 1 : -1),
          );
        }
        if (p.quoted_post?.id === postId) {
          updated.quoted_post = {
            ...p.quoted_post,
            user_liked: !isLiked,
            likes_count: Math.max(
              0,
              (p.quoted_post.likes_count || 0) + (!isLiked ? 1 : -1),
            ),
          };
        }
        return updated;
      }),
    );

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

    setPostStack((prev) =>
      prev.map((p) => {
        let updated = { ...p };
        if (p.id === postId) {
          updated.user_shared = !isShared;
          updated.shares_count = Math.max(
            0,
            (p.shares_count || 0) + (!isShared ? 1 : -1),
          );
        }
        if (p.quoted_post?.id === postId) {
          updated.quoted_post = {
            ...p.quoted_post,
            user_shared: !isShared,
            shares_count: Math.max(
              0,
              (p.quoted_post.shares_count || 0) + (!isShared ? 1 : -1),
            ),
          };
        }
        return updated;
      }),
    );

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

    setPostStack((prev) =>
      prev.map((p) => {
        let updated = { ...p };
        if (p.id === postId) {
          updated.user_saved = !isSaved;
          updated.saves_count = Math.max(
            0,
            (p.saves_count || 0) + (!isSaved ? 1 : -1),
          );
        }
        if (p.quoted_post?.id === postId) {
          updated.quoted_post = {
            ...p.quoted_post,
            user_saved: !isSaved,
            saves_count: Math.max(
              0,
              (p.quoted_post.saves_count || 0) + (!isSaved ? 1 : -1),
            ),
          };
        }
        return updated;
      }),
    );

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

  const handleLoadMore = async () => {};

  const handleRefresh = useCallback(async () => {
    setLocalRefreshing(true);
    try {
      await refreshPosts();
    } catch (error) {
      console.error("Yenileme hatası:", error);
    } finally {
      setLocalRefreshing(false);
    }
  }, [refreshPosts]);

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

  const renderItem = useCallback(
    ({ item: post }: { item: any }) => (
      <PostItem
        post={post}
        onPostPress={handlePostPressNav}
        onLike={() => handleLike(post.id, post.user_liked)}
        onShare={() => handleShare(post.id, post.user_shared)}
        onSave={() => handleSave(post.id, post.user_saved)}
        onComment={() => handleComment(post.id)}
        onMorePress={() => handleMorePress(post.id)}
        onUserPress={handleUserPress}
        onDelete={() => handleDelete(post.id)}
        onQuote={handleQuote}
      />
    ),
    [user, authModalVisible, posts, handlePostPressNav],
  );

  const currentPost =
    postStack.length > 0 ? postStack[postStack.length - 1] : null;

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
            borderBottomLeftRadius: currentPost
              ? scale(16)
              : (headerBorderRadius as any),
            borderBottomRightRadius: currentPost
              ? scale(16)
              : (headerBorderRadius as any),
          },
        ]}
      >
        <View style={styles.navbarContent}>
          <View
            style={[styles.navbarSide, { width: scale(isDesktop ? 28 : 40) }]}
          >
            {currentPost ? (
              <TouchableOpacity
                onPress={handleBackPress}
                style={[
                  styles.iconContainer,
                  {
                    width: scale(isDesktop ? 28 : 40),
                    height: scale(isDesktop ? 28 : 40),
                  },
                ]}
              >
                <Ionicons
                  name="arrow-back"
                  size={scale(isDesktop ? 18 : 24)}
                  color={colors.text || "#000000"}
                />
              </TouchableOpacity>
            ) : (
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
            )}
          </View>

          <View style={styles.navbarCenter}>
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 12 : 18),
                color: colors.text,
              }}
            >
              {currentPost
                ? "Gönderi"
                : user
                  ? profile?.username || "Akış"
                  : "Akış"}
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
            display: currentPost ? "none" : "flex",
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

      <Animated.FlatList
        style={{ display: currentPost ? "none" : "flex" }}
        ref={flatListRef}
        data={filteredPosts}
        extraData={posts}
        keyExtractor={getItemKey}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          {
            padding: scale(isDesktop ? 20 : 16),
            paddingTop: navbarHeight + tabsHeight + scale(10),
            paddingBottom: scale(30),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={localRefreshing}
            onRefresh={handleRefresh}
            progressViewOffset={Platform.OS === "android" ? -scale(5) : 0}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={false}
        ListEmptyComponent={
          !loading ? (
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
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      {currentPost && (
        <View style={{ flex: 1, backgroundColor: "transparent" }}>
          {/* DÜZELTME: key={currentPost.id} eklenerek sızıntıların önüne geçildi */}
          <PostDetail
            key={currentPost.id}
            post={currentPost}
            onPostPressNav={handlePostPressNav}
            getHandlers={(p: any) => ({
              onLike: () => handleLike(p.id, p.user_liked),
              onShare: () => handleShare(p.id, p.user_shared),
              onSave: () => handleSave(p.id, p.user_saved),
              onComment: () => handleComment(p.id),
              onMorePress: () => handleMorePress(p.id),
              onUserPress: handleUserPress,
              onDelete: () => {
                handleDelete(p.id);
                handleBackPress();
              },
              onQuote: handleQuote,
            })}
            navbarHeight={navbarHeight}
            colors={colors}
            scale={scale}
            isDesktop={isDesktop}
          />
        </View>
      )}

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
