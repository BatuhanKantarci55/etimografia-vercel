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
import { getAvatarSource } from "@utils/avatarUtils";
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

interface ProfileContentProps {
  tabKey: string;
  profileUserId?: string; // Eğer başka bir kullanıcının profiliyse
}

export default function ProfileContent({
  tabKey,
  profileUserId,
}: ProfileContentProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const {
    userPosts,
    fetchUserPosts,
    likePost,
    unlikePost,
    sharePost,
    unsharePost,
    savePost,
    unsavePost,
    deletePost,
  } = usePosts();
  const {
    followers,
    following,
    loading: followLoading,
    fetchFollowers,
    fetchFollowing,
    followUser,
    unfollowUser,
  } = useFollow();

  const [refreshing, setRefreshing] = useState(false);
  const [followType, setFollowType] = useState<"followers" | "following">(
    "followers",
  );
  const [selectorVisible, setSelectorVisible] = useState(false);

  // Profil bilgileri için state'ler
  const [profileData, setProfileData] = useState<{
    avatar_index: number;
    username: string;
    full_name: string | null;
  } | null>(null);

  // Hangi kullanıcının içeriğini göstereceğimiz
  const targetUserId = profileUserId || user?.id;

  // Profil bilgilerini getir
  const fetchProfileData = async () => {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_index, username, full_name")
        .eq("id", targetUserId)
        .single();

      if (error) {
        console.error("❌ ProfileContent - Profile fetch error:", error);
        return;
      }

      setProfileData(data);
    } catch (error) {
      console.error("❌ ProfileContent - Error:", error);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchUserPosts(targetUserId);
      fetchFollowers(targetUserId);
      fetchFollowing(targetUserId);
      fetchProfileData();
    }

    // Realtime dinleyici - sadece kendi profilimiz için
    if (targetUserId && targetUserId === user?.id) {
      const subscription = supabase
        .channel("profile-content-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${targetUserId}`,
          },
          (payload) => {
            console.log(
              "🔄 ProfileContent - Profile güncellendi:",
              payload.new,
            );
            const newProfile = payload.new;

            setProfileData((prev) => ({
              ...prev,
              avatar_index: newProfile.avatar_index ?? prev?.avatar_index ?? 0,
              username: newProfile.username ?? prev?.username ?? "Kullanıcı",
              full_name: newProfile.full_name ?? prev?.full_name,
            }));
          },
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [targetUserId, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (targetUserId) {
      await Promise.all([
        fetchUserPosts(targetUserId),
        fetchFollowers(targetUserId),
        fetchFollowing(targetUserId),
        fetchProfileData(),
      ]);
    }
    setRefreshing(false);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
    }
  };

  const handleShare = async (postId: string, isShared: boolean) => {
    if (isShared) {
      await unsharePost(postId);
    } else {
      await sharePost(postId);
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    if (isSaved) {
      await unsavePost(postId);
    } else {
      await savePost(postId);
    }
  };

  const handleComment = (postId: string) => {
    Alert.alert("Yorum", "Yorum yapma özelliği yakında eklenecek!");
  };

  const handleMorePress = (postId: string) => {};

  const handleDelete = async (postId: string) => {
    const { error } = await deletePost(postId);
    if (error) {
      Alert.alert("Hata", "Gönderi silinirken bir hata oluştu");
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (isFollowing) {
      await unfollowUser(targetUserId);
    } else {
      await followUser(targetUserId);
    }
    // Listeleri yenile
    if (targetUserId) {
      await fetchFollowers(targetUserId);
      await fetchFollowing(targetUserId);
    }
  };

  const renderSharedPostHeader = (post: Post) => {
    if (post.is_shared_post && post.original_user) {
      return (
        <View
          style={[
            styles.sharedHeader,
            {
              padding: scale(8),
              backgroundColor: colors.primary + "10",
              borderTopLeftRadius: scale(12),
              borderTopRightRadius: scale(12),
            },
            isDesktop && { width: "70%", alignSelf: "center" },
          ]}
        >
          <Ionicons name="repeat" size={scale(14)} color={colors.primary} />
          <CustomText
            style={{
              fontSize: scale(12),
              color: colors.primary,
              marginLeft: scale(4),
              flex: 1,
            }}
          >
            {post.original_user.username} tarafından paylaşıldı
          </CustomText>
        </View>
      );
    }
    return null;
  };

  const getItemKey = (item: Post | any) => {
    if (item.is_shared_post) {
      return `shared-${item.id}-${item.original_post_id}`;
    }
    if (item.quoted_post_id) {
      return `quote-${item.id}-${item.quoted_post_id}`;
    }
    return `post-${item.id}`;
  };

  const renderPosts = () => (
    <FlatList
      data={userPosts}
      keyExtractor={getItemKey}
      renderItem={({ item }) => (
        <View style={{ marginBottom: scale(12) }}>
          {renderSharedPostHeader(item)}
          <PostItem
            post={item}
            onLike={() => handleLike(item.id, item.user_liked)}
            onShare={() => handleShare(item.id, item.user_shared)}
            onSave={() => handleSave(item.id, item.user_saved)}
            onComment={() => handleComment(item.id)}
            onMorePress={() => handleMorePress(item.id)}
            onUserPress={handleUserPress}
            onDelete={() => handleDelete(item.id)}
          />
        </View>
      )}
      numColumns={1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.postsList}
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
            {!user
              ? "Gönderileri görmek için giriş yapın."
              : targetUserId === user?.id
                ? "Henüz gönderiniz yok."
                : "Bu kullanıcının henüz gönderisi yok."}
          </CustomText>
          {user && targetUserId === user?.id && (
            <CustomText
              style={{
                fontSize: scale(14),
                color: colors.text + "40",
                marginTop: scale(8),
                textAlign: "center",
              }}
            >
              Paylaşmak için + butonuna tıklayın
            </CustomText>
          )}
        </View>
      }
    />
  );

  const renderFollowList = () => {
    const data = followType === "followers" ? followers : following;

    return (
      <View>
        {/* Seçici Kutu */}
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
          <Ionicons
            name="chevron-down"
            size={scale(20)}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* Liste */}
        <FlatList
          data={data}
          keyExtractor={(item) => `follow-${item.id}`}
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
                        source={getAvatarSource(item.avatar_index || 0)}
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

                  {/* Takip Butonu - Kendi profilimizde gösterme */}
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
                {!user
                  ? "Takip listenizi görmek için giriş yapın."
                  : followType === "followers"
                    ? "Henüz takipçiniz yok."
                    : "Henüz kimseyi takip etmiyorsunuz."}
              </CustomText>
            </View>
          }
        />

        {/* Seçici Modal */}
        <FollowSelector
          visible={selectorVisible}
          onClose={() => setSelectorVisible(false)}
          onSelect={setFollowType}
          currentType={followType}
        />
      </View>
    );
  };

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
            {!user
              ? "Rozetleri görmek için giriş yapın."
              : "Henüz rozetiniz yok."}
          </CustomText>
        </View>
      }
    />
  );

  const renderRankings = () => {
    if (!user) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="trophy-outline"
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
            Sıralamaları görmek için giriş yapın.
          </CustomText>
        </View>
      );
    }
    return (
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
  };

  const content = (() => {
    switch (tabKey) {
      case "gönderi":
        return renderPosts();
      case "takipçi":
        return renderFollowList();
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
    </View>
  );
}

const styles = StyleSheet.create({
  postsList: {
    paddingBottom: 20,
  },
  sharedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
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
  },
});
