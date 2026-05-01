import AuthRequiredModal from "@components/AuthRequiredModal";
import CustomText from "@components/CustomText";
import PostItem from "@components/Feed/PostItem";
import FollowSelector from "@components/Profile/FollowSelector";
import { useAuth } from "@contexts/AuthContext";
import { useFollow } from "@contexts/FollowContext";
import { Post, usePosts } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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

// Profil bilgilerini getir (manuel join)
const fetchProfileById = async (userId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_index")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Profil bilgisi alınamadı:", error);
    return null;
  }
};

interface UserProfileContentProps {
  tabKey: string;
  userId: string;
}

export default function UserProfileContent({
  tabKey,
  userId,
}: UserProfileContentProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { followUser, unfollowUser } = useFollow();
  const { likePost, unlikePost, sharePost, unsharePost, savePost, unsavePost } =
    usePosts();

  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [followType, setFollowType] = useState<"followers" | "following">(
    "followers",
  );
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Misafir kullanıcı için uyarı penceresi durumu
  const [authModalVisible, setAuthModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId, tabKey]);

  const fetchData = async () => {
    setLoading(true);

    if (tabKey === "gönderi") {
      await fetchPosts();
    } else if (tabKey === "takipçi") {
      await fetchFollowers();
    } else if (tabKey === "takip") {
      await fetchFollowing();
    }

    setLoading(false);
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("post_stats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithUserActions = await Promise.all(
        (data || []).map(async (post: any) => {
          if (!user)
            return {
              ...post,
              user_liked: false,
              user_shared: false,
              user_saved: false,
            };

          const [liked, shared, saved] = await Promise.all([
            supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("post_shares")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("post_saves")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);

          return {
            ...post,
            user_liked: !!liked.data,
            user_shared: !!shared.data,
            user_saved: !!saved.data,
          };
        }),
      );

      setPosts(postsWithUserActions);
    } catch (error) {
      console.error("Gönderiler alınamadı:", error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId);

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowers([]);
        return;
      }

      const followerIds = followsData.map((f) => f.follower_id);

      const followersWithStats = await Promise.all(
        followerIds.map(async (followerId) => {
          const profile = await fetchProfileById(followerId);
          if (!profile) return null;

          const { count: followersCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profile.id);

          const { count: postsCount } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          let isFollowing = false;
          if (user) {
            const { data: followData } = await supabase
              .from("follows")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", profile.id)
              .maybeSingle();
            isFollowing = !!followData;
          }

          return {
            ...profile,
            followers_count: followersCount || 0,
            posts_count: postsCount || 0,
            is_following: isFollowing,
          };
        }),
      );

      setFollowers(followersWithStats.filter(Boolean));
    } catch (error) {
      console.error("Takipçiler alınamadı:", error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowing([]);
        return;
      }

      const followingIds = followsData.map((f) => f.following_id);

      const followingWithStats = await Promise.all(
        followingIds.map(async (followingId) => {
          const profile = await fetchProfileById(followingId);
          if (!profile) return null;

          const { count: followersCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profile.id);

          const { count: postsCount } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          let isFollowing = false;
          if (user) {
            const { data: followData } = await supabase
              .from("follows")
              .select("id")
              .eq("follower_id", user.id)
              .eq("following_id", profile.id)
              .maybeSingle();
            isFollowing = !!followData;
          }

          return {
            ...profile,
            followers_count: followersCount || 0,
            posts_count: postsCount || 0,
            is_following: isFollowing,
          };
        }),
      );

      setFollowing(followingWithStats.filter(Boolean));
    } catch (error) {
      console.error("Takip edilenler alınamadı:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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
    Alert.alert("Yorum", "Yorum yapma özelliği yakında eklenecek!");
  };

  const handleMorePress = (postId: string) => {};

  const handleUserPress = (targetUserId: string) => {
    router.push(`/user/${targetUserId}`);
  };

  const handleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }

    if (isFollowing) {
      await unfollowUser(targetUserId);
    } else {
      await followUser(targetUserId);
    }

    if (tabKey === "takipçi") {
      await fetchFollowers();
    } else if (tabKey === "takip") {
      await fetchFollowing();
    }
  };

  const getAvatarSource = (avatarIndex: number) => {
    return allAvatars[avatarIndex % allAvatars.length];
  };

  const renderPosts = () => (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ marginBottom: scale(12) }}>
          <PostItem
            post={item}
            onLike={() => handleLike(item.id, item.user_liked)}
            onShare={() => handleShare(item.id, item.user_shared)}
            onSave={() => handleSave(item.id, item.user_saved)}
            onComment={() => handleComment(item.id)}
            onMorePress={() => handleMorePress(item.id)}
            onUserPress={handleUserPress}
          />
        </View>
      )}
      numColumns={1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="images-outline"
            size={scale(64)}
            color={colors.text + "40"}
          />
          <CustomText
            style={[
              styles.emptyText,
              {
                fontSize: scale(16),
                color: colors.text + "60",
                marginTop: scale(16),
                textAlign: "center",
              },
            ]}
          >
            Bu kullanıcının henüz gönderisi yok.
          </CustomText>
        </View>
      }
    />
  );

  const renderFollowList = (data: any[]) => (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isFollowing = item.is_following === true;

        return (
          <View
            style={[
              styles.friendItem,
              {
                backgroundColor: colors.card,
                padding: scale(12),
                borderRadius: scale(12),
                marginBottom: scale(10),
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Avatar - tıklanabilir */}
              <TouchableOpacity
                onPress={() => handleUserPress(item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.friendAvatar,
                    {
                      width: scale(50),
                      height: scale(50),
                      borderRadius: scale(25),
                      marginRight: scale(12),
                      overflow: "hidden",
                    },
                  ]}
                >
                  <Image
                    source={getAvatarSource(item.avatar_index)}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>

              {/* Bilgiler - kullanıcı adı tıklanabilir */}
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleUserPress(item.id)}
                activeOpacity={0.7}
              >
                <CustomText
                  style={{
                    fontSize: scale(16),
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  {item.username}
                </CustomText>
                {item.full_name && (
                  <CustomText
                    style={{
                      fontSize: scale(13),
                      color: colors.text + "80",
                      marginTop: scale(2),
                    }}
                  >
                    {item.full_name}
                  </CustomText>
                )}
                <View style={{ flexDirection: "row", marginTop: scale(4) }}>
                  <CustomText
                    style={{
                      fontSize: scale(11),
                      color: colors.text + "60",
                    }}
                  >
                    {item.followers_count} takipçi
                  </CustomText>
                  <CustomText
                    style={{
                      fontSize: scale(11),
                      color: colors.text + "60",
                      marginLeft: scale(8),
                    }}
                  >
                    {item.posts_count} gönderi
                  </CustomText>
                </View>
              </TouchableOpacity>

              {/* Takip Butonu */}
              {user?.id !== item.id && (
                <TouchableOpacity
                  style={[
                    styles.friendActionButton,
                    {
                      backgroundColor: isFollowing
                        ? colors.primary + "20"
                        : colors.primary,
                      paddingHorizontal: scale(12),
                      paddingVertical: scale(4),
                      borderRadius: scale(16),
                      minWidth: scale(70),
                    },
                  ]}
                  onPress={() => handleFollow(item.id, isFollowing)}
                >
                  <CustomText
                    style={{
                      fontSize: scale(11),
                      color: isFollowing ? colors.primary : "white",
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {isFollowing ? "Takip Ediliyor" : "Takip Et"}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="people-outline"
            size={scale(64)}
            color={colors.text + "40"}
          />
          <CustomText
            style={[
              styles.emptyText,
              {
                fontSize: scale(16),
                color: colors.text + "60",
                marginTop: scale(16),
                textAlign: "center",
              },
            ]}
          >
            {tabKey === "takipçi"
              ? "Bu kullanıcının henüz takipçisi yok."
              : "Bu kullanıcı henüz kimseyi takip etmiyor."}
          </CustomText>
        </View>
      }
    />
  );

  const renderBadges = () => (
    <FlatList
      data={[]}
      keyExtractor={(item, index) => `badge-${index}`}
      numColumns={2}
      renderItem={({ item }) => (
        <View
          style={[
            styles.badgeItem,
            {
              backgroundColor: colors.card,
              padding: scale(16),
              borderRadius: scale(16),
              alignItems: "center",
              margin: scale(4),
              flex: 1,
            },
          ]}
        >
          <View
            style={[
              styles.badgeIcon,
              {
                backgroundColor: colors.primary + "20",
                width: scale(60),
                height: scale(60),
                borderRadius: scale(30),
                justifyContent: "center",
                alignItems: "center",
                marginBottom: scale(10),
              },
            ]}
          >
            <Ionicons name="ribbon" size={scale(32)} color={colors.primary} />
          </View>
          <CustomText
            style={{
              fontSize: scale(14),
              color: colors.text,
              textAlign: "center",
            }}
          >
            Rozet Adı
          </CustomText>
          <CustomText
            style={{
              fontSize: scale(10),
              color: colors.text + "80",
              marginTop: scale(4),
              textAlign: "center",
            }}
          >
            Açıklama buraya
          </CustomText>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="medal-outline"
            size={scale(64)}
            color={colors.text + "40"}
          />
          <CustomText
            style={[
              styles.emptyText,
              {
                fontSize: scale(16),
                color: colors.text + "60",
                marginTop: scale(16),
                textAlign: "center",
              },
            ]}
          >
            Bu kullanıcının henüz rozeti yok.
          </CustomText>
        </View>
      }
    />
  );

  const renderRankings = () => (
    <FlatList
      data={[
        { mode: "Eğitim Modu", rank: 42, points: 1500 },
        { mode: "Alıştırma Modu", rank: 52, points: 1400 },
        { mode: "Müsabaka Modu", rank: 62, points: 1300 },
      ]}
      keyExtractor={(item, index) => `ranking-${index}`}
      renderItem={({ item }) => (
        <View
          style={[
            styles.rankingCard,
            {
              backgroundColor: colors.card,
              padding: scale(16),
              borderRadius: scale(12),
              marginBottom: scale(12),
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <CustomText style={{ fontSize: scale(16), color: colors.text }}>
              {item.mode}
            </CustomText>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="trophy" size={scale(20)} color="#FFD700" />
              <CustomText
                style={{
                  fontSize: scale(20),
                  color: colors.text,
                  marginLeft: scale(8),
                }}
              >
                {item.rank}
              </CustomText>
            </View>
          </View>
          <CustomText
            style={{
              fontSize: scale(14),
              color: colors.text + "80",
              marginTop: scale(8),
            }}
          >
            Puan: {item.points}
          </CustomText>
        </View>
      )}
    />
  );

  const renderTakipciList = () => (
    <View>
      <TouchableOpacity
        style={[
          styles.selectorBox,
          {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.primary + "40",
            borderRadius: scale(25),
            padding: scale(12),
            marginBottom: scale(16),
            marginHorizontal: scale(16),
          },
        ]}
        onPress={() => setSelectorVisible(true)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name={followType === "followers" ? "people" : "person-add"}
            size={scale(20)}
            color={colors.primary}
          />
          <CustomText
            style={{
              fontSize: scale(16),
              color: colors.text,
              marginLeft: scale(8),
              fontWeight: "500",
            }}
          >
            {followType === "followers" ? "Takipçiler" : "Takip Edilenler"}
          </CustomText>
        </View>
        <Ionicons name="chevron-down" size={scale(20)} color={colors.primary} />
      </TouchableOpacity>

      {renderFollowList(followType === "followers" ? followers : following)}

      <FollowSelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onSelect={setFollowType}
        currentType={followType}
      />
    </View>
  );

  const content = (() => {
    switch (tabKey) {
      case "gönderi":
        return renderPosts();
      case "takipçi":
        return renderTakipciList();
      case "rozet":
        return renderBadges();
      case "sıralama":
        return renderRankings();
      default:
        return null;
    }
  })();

  return (
    <View
      style={[
        { flex: 1 },
        isDesktop && { width: "100%", maxWidth: 610, alignSelf: "flex-start" },
      ]}
    >
      {content}

      <AuthRequiredModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontWeight: "500",
  },
  selectorBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    minWidth: 180,
  },
  friendItem: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 16,
  },
  friendAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  friendActionButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  badgeItem: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankingCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
  },
});
