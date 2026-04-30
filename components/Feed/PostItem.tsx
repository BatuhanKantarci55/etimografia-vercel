import CustomText from "@components/CustomText";
import CommentModal from "@components/Feed/CommentModal";
import PostActions from "@components/Feed/PostActions";
import PostContent from "@components/Feed/PostContent";
import QuoteModal from "@components/Feed/QuoteModal";
import ShareToDMModal from "@components/Messages/ShareToDMModal";
import { useAuth } from "@contexts/AuthContext";
import { useFollow } from "@contexts/FollowContext";
import { Post } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getAvatarSource } from "@utils/avatarUtils";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal, Platform, StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

interface PostItemProps {
  post: Post;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  onComment: () => void;
  onMorePress: () => void;
  onUserPress?: (userId: string) => void;
  onDelete?: () => void;
  onQuote?: (postId: string, quoteText: string) => Promise<any>;
}

export default function PostItem({
  post,
  onLike,
  onShare,
  onSave,
  onComment,
  onMorePress,
  onUserPress,
  onDelete,
  onQuote,
}: PostItemProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { checkFollowStatus, followUser, unfollowUser, addFollowListener } =
    useFollow();

  const [menuVisible, setMenuVisible] = useState(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [avatarIndex, setAvatarIndex] = useState(post.avatar_index || 0);
  const [username, setUsername] = useState(post.username || "Kullanıcı");
  const [fullName, setFullName] = useState(post.full_name || null);

  const subscriptionRef = useRef<any>(null);

  const [localStats, setLocalStats] = useState({
    likes: post.likes_count || 0,
    shares: post.shares_count || 0,
    saves: post.saves_count || 0,
    quotes: post.quotes_count || 0,
    comments: post.comments_count || 0,
  });
  const [localUserLiked, setLocalUserLiked] = useState(
    post.user_liked || false,
  );
  const [localUserShared, setLocalUserShared] = useState(
    post.user_shared || false,
  );
  const [localUserSaved, setLocalUserSaved] = useState(
    post.user_saved || false,
  );

  useEffect(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_index, username, full_name")
          .eq("id", post.user_id)
          .single();

        if (error) return;

        if (data) {
          setAvatarIndex(data.avatar_index || 0);
          setUsername(data.username || "Kullanıcı");
          setFullName(data.full_name || null);
        }
      } catch (error) {
        console.error("❌ PostItem - Error:", error);
      }
    };

    fetchProfileData();

    const subscription = supabase
      .channel(`post-profile-${post.user_id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${post.user_id}`,
        },
        (payload) => {
          const newProfile = payload.new;
          if (newProfile.avatar_index !== undefined)
            setAvatarIndex(newProfile.avatar_index);
          if (newProfile.username) setUsername(newProfile.username);
          if (newProfile.full_name !== undefined)
            setFullName(newProfile.full_name);
        },
      )
      .subscribe();

    subscriptionRef.current = subscription;
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, [post.user_id]);

  useEffect(() => {
    if (user && post.user_id !== user.id) {
      checkFollowStatus(post.user_id).then(setIsFollowing);
    }
  }, [post.user_id, user]);

  useEffect(() => {
    if (!user || post.user_id === user.id) return;
    const removeListener = addFollowListener((userId, following) => {
      if (userId === post.user_id) setIsFollowing(following);
    });
    return removeListener;
  }, [post.user_id, user, addFollowListener]);

  const handleLike = () => {
    const newLiked = !localUserLiked;
    setLocalUserLiked(newLiked);
    setLocalStats({
      ...localStats,
      likes: newLiked ? localStats.likes + 1 : localStats.likes - 1,
    });
    onLike();
  };

  const handleShare = () => {
    const newShared = !localUserShared;
    setLocalUserShared(newShared);
    setLocalStats({
      ...localStats,
      shares: newShared ? localStats.shares + 1 : localStats.shares - 1,
    });
    onShare();
  };

  const handleSave = () => {
    const newSaved = !localUserSaved;
    setLocalUserSaved(newSaved);
    setLocalStats({
      ...localStats,
      saves: newSaved ? localStats.saves + 1 : localStats.saves - 1,
    });
    onSave();
  };

  const handleQuote = async (quoteText: string) => {
    if (onQuote) {
      const result = await onQuote(post.id, quoteText);
      if (result !== false) {
        setLocalStats({ ...localStats, quotes: localStats.quotes + 1 });
      }
    }
  };

  const handleMorePress = () => setMenuVisible(true);

  const handleDelete = () => {
    setMenuVisible(false);
    if (!onDelete) {
      console.warn("onDelete callback is not provided");
      return;
    }

    const confirmDelete = () => {
      if (Platform.OS === "web") {
        // Web'de window.confirm kullan
        const confirmed = window.confirm(
          "Bu gönderiyi silmek istediğinize emin misiniz?",
        );
        if (confirmed) {
          onDelete();
        }
      } else {
        // Mobilde Alert.alert kullan
        Alert.alert(
          "Gönderiyi Sil",
          "Bu gönderiyi silmek istediğinize emin misiniz?",
          [
            { text: "İptal", style: "cancel" },
            {
              text: "Sil",
              style: "destructive",
              onPress: () => onDelete(),
            },
          ],
        );
      }
    };

    confirmDelete();
  };

  const handleCommentPress = () => {
    setCommentModalVisible(true);
    if (onComment) onComment();
  };

  const handleSendPress = () => {
    if (!user) {
      Alert.alert("Giriş Yapın", "Bu işlemi yapmak için giriş yapmalısınız.");
      return;
    }
    setShareModalVisible(true);
  };

  const handleCommentAdded = () =>
    setLocalStats((prev) => ({ ...prev, comments: prev.comments + 1 }));
  const handleCommentDeleted = () =>
    setLocalStats((prev) => ({
      ...prev,
      comments: Math.max(0, prev.comments - 1),
    }));

  const handleFollowToggle = async () => {
    if (!user) return;
    setFollowLoading(true);
    if (isFollowing) await unfollowUser(post.user_id);
    else await followUser(post.user_id);
    setFollowLoading(false);
  };

  const handleUserPressInternal = () => {
    if (onUserPress) onUserPress(post.user_id);
    else router.push(`/user/${post.user_id}`);
  };

  const getAvatarSourceForUser = () => getAvatarSource(avatarIndex);
  const getQuotedUserAvatar = () => {
    if (post.quoted_post)
      return getAvatarSource(post.quoted_post.avatar_index || 0);
    return getAvatarSource(0);
  };

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

  const isOwnPost = user?.id === post.user_id;
  const isQuote = !!post.quoted_post_id;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          marginBottom: scale(isDesktop ? 4 : 12),
          borderRadius: scale(isDesktop ? 8 : 12),
          overflow: "hidden",
        },
        isDesktop && { width: "80%", alignSelf: "center" },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: scale(12),
            paddingVertical: scale(isDesktop ? 6 : 12),
            borderBottomWidth: isQuote ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: colors.text + "20",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.userInfo}
          onPress={handleUserPressInternal}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.avatar,
              {
                width: scale(isDesktop ? 28 : 40),
                height: scale(isDesktop ? 28 : 40),
                borderRadius: scale(isDesktop ? 14 : 20),
                backgroundColor: colors.primary + "20",
                marginRight: scale(10),
                overflow: "hidden",
              },
            ]}
          >
            {!imageError ? (
              <Image
                source={getAvatarSourceForUser()}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={[
                  styles.avatarImage,
                  { justifyContent: "center", alignItems: "center" },
                ]}
              >
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 10 : 18),
                    color: colors.primary,
                  }}
                >
                  {username?.charAt(0)?.toUpperCase() || "U"}
                </CustomText>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 10 : 14),
                color: colors.text,
              }}
            >
              {username}
            </CustomText>
            {fullName && (
              <CustomText
                style={{
                  fontSize: scale(isDesktop ? 9 : 12),
                  color: colors.text + "80",
                }}
              >
                {fullName}
              </CustomText>
            )}
          </View>
        </TouchableOpacity>

        {!isOwnPost && (
          <TouchableOpacity
            style={[
              styles.followButton,
              {
                backgroundColor: isFollowing ? "transparent" : colors.primary,
                borderWidth: isFollowing ? 1 : 0,
                borderColor: isFollowing ? colors.text + "40" : "transparent",
                paddingHorizontal: scale(isDesktop ? 8 : 12),
                paddingVertical: scale(isDesktop ? 3 : 6),
                borderRadius: scale(16),
                marginRight: scale(8),
              },
            ]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 8 : 12),
                color: isFollowing ? colors.text + "80" : "white",
                fontWeight: "600",
              }}
            >
              {followLoading
                ? "..."
                : isFollowing
                  ? "Takip Ediliyor"
                  : "Takip Et"}
            </CustomText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleMorePress}
          style={[styles.moreButton, { padding: scale(5) }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={scale(isDesktop ? 11 : 20)}
            color={colors.text + "80"}
          />
        </TouchableOpacity>

        {/* Modal - Web'de tıklama sorununu çözmek için event propagation durduruldu */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: colors.card,
                  borderRadius: scale(isDesktop ? 8 : 12),
                  padding: scale(isDesktop ? 4 : 8),
                  maxWidth: isDesktop ? 180 : 300,
                },
              ]}
              onStartShouldSetResponder={() => true}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {isOwnPost && onDelete && (
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    {
                      padding: scale(isDesktop ? 8 : 12),
                      borderRadius: scale(6),
                    },
                  ]}
                  onPress={handleDelete}
                >
                  <Ionicons
                    name="trash-outline"
                    size={scale(isDesktop ? 14 : 20)}
                    color="#FF3B30"
                  />
                  <CustomText
                    style={[
                      styles.menuText,
                      {
                        fontSize: scale(isDesktop ? 11 : 16),
                        color: "#FF3B30",
                        marginLeft: scale(isDesktop ? 8 : 12),
                      },
                    ]}
                  >
                    Gönderiyi Sil
                  </CustomText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  {
                    padding: scale(isDesktop ? 8 : 12),
                    borderRadius: scale(6),
                  },
                ]}
                onPress={() => {
                  setMenuVisible(false);
                  onMorePress();
                }}
              >
                <Ionicons
                  name="flag-outline"
                  size={scale(isDesktop ? 14 : 20)}
                  color={colors.text}
                />
                <CustomText
                  style={[
                    styles.menuText,
                    {
                      fontSize: scale(isDesktop ? 11 : 16),
                      color: colors.text,
                      marginLeft: scale(isDesktop ? 8 : 12),
                    },
                  ]}
                >
                  Şikayet Et
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  {
                    padding: scale(isDesktop ? 8 : 12),
                    borderRadius: scale(6),
                  },
                ]}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons
                  name="close-outline"
                  size={scale(isDesktop ? 14 : 20)}
                  color={colors.text}
                />
                <CustomText
                  style={[
                    styles.menuText,
                    {
                      fontSize: scale(isDesktop ? 11 : 16),
                      color: colors.text,
                      marginLeft: scale(isDesktop ? 8 : 12),
                    },
                  ]}
                >
                  İptal
                </CustomText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {isQuote && post.quote_text && (
        <View
          style={[
            styles.quoteInfo,
            {
              paddingHorizontal: scale(12),
              paddingBottom: scale(isDesktop ? 2 : 8),
              paddingTop: scale(isDesktop ? 0 : 8),
            },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={scale(isDesktop ? 10 : 14)}
            color={colors.primary}
          />
          <CustomText
            fontFamily="medium"
            style={[
              styles.quoteText,
              {
                color: colors.text,
                marginLeft: scale(4),
                flex: 1,
                fontSize: scale(isDesktop ? 10 : 14),
              },
            ]}
          >
            {post.quote_text}
          </CustomText>
        </View>
      )}

      {post.quoted_post && (
        <View
          style={[
            styles.quotedPost,
            {
              backgroundColor: colors.card + "80",
              marginHorizontal: scale(12),
              marginBottom: scale(isDesktop ? 0 : 12),
              borderRadius: scale(8),
              padding: 0,
              borderWidth: 1,
              borderColor: colors.text + "10",
              overflow: "hidden",
            },
          ]}
        >
          <View
            style={[
              styles.quotedUserInfo,
              { padding: scale(8), marginBottom: 0 },
            ]}
          >
            <View
              style={[
                styles.quotedAvatar,
                {
                  width: scale(24),
                  height: scale(24),
                  borderRadius: scale(12),
                  backgroundColor: colors.primary + "20",
                  marginRight: scale(6),
                  overflow: "hidden",
                },
              ]}
            >
              <Image
                source={getQuotedUserAvatar()}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 10 : 12),
                color: colors.text,
              }}
            >
              {post.quoted_post.username}
            </CustomText>
          </View>

          <PostContent
            content={{
              type: post.quoted_post.post_type,
              text: post.quoted_post.content,
              image: post.quoted_post.image_url,
              video: post.quoted_post.video_url,
              poll: post.quoted_post.poll_data,
            }}
            postId={post.quoted_post.id}
            userVotedOption={post.quoted_post.user_voted_option}
            isQuoted={true}
          />

          {post.quoted_post.content &&
            ["image", "video"].includes(post.quoted_post.post_type) && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  paddingHorizontal: scale(12),
                  paddingBottom: scale(12),
                }}
              >
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 10 : 12),
                    color: colors.text,
                  }}
                >
                  {post.quoted_post.username}
                </CustomText>
                <CustomText
                  fontFamily="medium"
                  style={{
                    fontSize: scale(isDesktop ? 10 : 12),
                    color: colors.text + "80",
                    marginLeft: scale(4),
                  }}
                >
                  {post.quoted_post.content.length > 50
                    ? post.quoted_post.content.substring(0, 50) + "..."
                    : post.quoted_post.content}
                </CustomText>
              </View>
            )}
        </View>
      )}

      {!isQuote && (
        <PostContent
          content={{
            type: post.post_type,
            text: post.content,
            image: post.image_url,
            video: post.video_url,
            poll: post.poll_data,
          }}
          postId={post.id}
          userVotedOption={post.user_voted_option}
          isQuoted={false}
        />
      )}

      <PostActions
        stats={{
          likes: localStats.likes,
          comments: localStats.comments,
          shares: localStats.shares,
          saves: localStats.saves,
          quotes: localStats.quotes,
        }}
        userLiked={localUserLiked}
        userShared={localUserShared}
        userSaved={localUserSaved}
        onLike={handleLike}
        onShare={handleShare}
        onSave={handleSave}
        onComment={handleCommentPress}
        onQuote={() => setQuoteModalVisible(true)}
        onSend={handleSendPress}
        showUsername={["image", "video"].includes(post.post_type) && !isQuote}
        username={username}
        text={post.content}
        postUserId={post.user_id}
      />

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: scale(12),
            paddingVertical: scale(isDesktop ? 2 : 12),
          },
        ]}
      >
        <CustomText
          fontFamily="medium"
          style={{
            fontSize: scale(isDesktop ? 8 : 12),
            color: colors.text + "60",
          }}
        >
          {formatTime(post.created_at)}
        </CustomText>
      </View>

      {onQuote && (
        <QuoteModal
          visible={quoteModalVisible}
          onClose={() => setQuoteModalVisible(false)}
          post={post}
          onQuote={handleQuote}
        />
      )}

      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        postId={post.id}
        postUserId={post.user_id}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
      />

      <ShareToDMModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        post={post}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  followButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  moreButton: {},
  quoteInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  quoteText: {},
  quotedPost: {
    overflow: "hidden",
  },
  quotedUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  quotedAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: "80%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontWeight: "500",
  },
});
