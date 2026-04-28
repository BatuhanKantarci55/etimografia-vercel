import { supabase } from "@lib/supabase";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export type FollowStats = {
  followers_count: number;
  following_count: number;
  posts_count: number;
};

export type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_index: number;
  banner_index: number;
  bio: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following?: boolean;
  is_follower?: boolean;
};

type FollowContextType = {
  followers: UserProfile[];
  following: UserProfile[];
  followingIds: Set<string>;
  suggestions: UserProfile[];
  stats: FollowStats | null;
  loading: boolean;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  fetchUserStats: (userId: string) => Promise<FollowStats | null>;
  followUser: (userId: string) => Promise<any>;
  unfollowUser: (userId: string) => Promise<any>;
  checkFollowStatus: (userId: string) => Promise<boolean>;
  refreshFollowData: () => Promise<void>;
  addFollowListener: (
    listener: (userId: string, isFollowing: boolean) => void,
  ) => () => void;
};

const FollowContext = createContext<FollowContextType>({
  followers: [],
  following: [],
  followingIds: new Set(),
  suggestions: [],
  stats: null,
  loading: false,
  fetchFollowers: async () => {},
  fetchFollowing: async () => {},
  fetchSuggestions: async () => {},
  fetchUserStats: async () => null,
  followUser: async () => {},
  unfollowUser: async () => {},
  checkFollowStatus: async () => false,
  refreshFollowData: async () => {},
  addFollowListener: () => () => {},
});

export const useFollow = () => useContext(FollowContext);

export const FollowProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [listeners, setListeners] = useState<
    ((userId: string, isFollowing: boolean) => void)[]
  >([]);

  const addFollowListener = useCallback(
    (listener: (userId: string, isFollowing: boolean) => void) => {
      setListeners((prev) => [...prev, listener]);
      return () => {
        setListeners((prev) => prev.filter((l) => l !== listener));
      };
    },
    [],
  );

  const notifyFollowChange = useCallback(
    (userId: string, isFollowing: boolean) => {
      listeners.forEach((listener) => {
        try {
          listener(userId, isFollowing);
        } catch (error) {
          console.error("Dinleyici hatası:", error);
        }
      });
    },
    [listeners],
  );

  const updateFollowingIds = (followingList: UserProfile[]) => {
    setFollowingIds(new Set(followingList.map((f) => f.id)));
  };

  const fetchProfileById = async (userId: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_index, banner_index, bio")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Profil bilgisi alınamadı:", error);
      return null;
    }
  };

  const fetchFollowers = async (userId: string) => {
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

          const stats = await fetchUserStats(followerId);

          let isFollowing = false;
          if (user) {
            isFollowing = await checkFollowStatus(followerId);
          }

          return {
            ...profile,
            followers_count: stats?.followers_count || 0,
            following_count: stats?.following_count || 0,
            posts_count: stats?.posts_count || 0,
            is_following: isFollowing,
          };
        }),
      );

      setFollowers(followersWithStats.filter(Boolean));
    } catch (error) {
      console.error("Takipçiler alınamadı:", error);
    }
  };

  const fetchFollowing = async (userId: string) => {
    try {
      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowing([]);
        setFollowingIds(new Set());
        return;
      }

      const followingIds = followsData.map((f) => f.following_id);

      const followingWithStats = await Promise.all(
        followingIds.map(async (followingId) => {
          const profile = await fetchProfileById(followingId);
          if (!profile) return null;

          const stats = await fetchUserStats(followingId);

          return {
            ...profile,
            followers_count: stats?.followers_count || 0,
            following_count: stats?.following_count || 0,
            posts_count: stats?.posts_count || 0,
            is_following: true,
          };
        }),
      );

      const filteredFollowing = followingWithStats.filter(
        Boolean,
      ) as UserProfile[];
      setFollowing(filteredFollowing);
      setFollowingIds(new Set(filteredFollowing.map((f) => f.id)));
    } catch (error) {
      console.error("Takip edilenler alınamadı:", error);
    }
  };

  const fetchSuggestions = async () => {
    if (!user) return;

    try {
      const { data: followingData, error: followingError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingError) throw followingError;

      const followingIds = (followingData || []).map((f) => f.following_id);

      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_index, banner_index, bio")
        .neq("id", user.id);

      const { data: allProfiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      const suggestions = (allProfiles || []).filter(
        (profile) => !followingIds.includes(profile.id),
      );

      const suggestionsWithStats = await Promise.all(
        suggestions.slice(0, 10).map(async (profile) => {
          const stats = await fetchUserStats(profile.id);

          return {
            ...profile,
            followers_count: stats?.followers_count || 0,
            following_count: stats?.following_count || 0,
            posts_count: stats?.posts_count || 0,
            is_following: false,
          };
        }),
      );

      setSuggestions(suggestionsWithStats);
    } catch (error) {
      console.error("Takip önerileri alınamadı:", error);
    }
  };

  const fetchUserStats = async (
    userId: string,
  ): Promise<FollowStats | null> => {
    try {
      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (followersError) throw followersError;

      const { count: followingCount, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (followingError) throw followingError;

      const { count: postsCount, error: postsError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (postsError) throw postsError;

      return {
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        posts_count: postsCount || 0,
      };
    } catch (error) {
      console.error("Kullanıcı istatistikleri alınamadı:", error);
      return null;
    }
  };

  const followUser = async (userId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: userId });

      if (error) throw error;

      // İstatistikleri güncelle
      if (stats) {
        setStats({
          ...stats,
          following_count: stats.following_count + 1,
        });
      }

      // Takip edilenler listesini güncelle - önce mevcut listede var mı kontrol et
      const existingIndex = following.findIndex((f) => f.id === userId);

      if (existingIndex === -1) {
        // Yoksa yeni ekle
        const profile = await fetchProfileById(userId);
        if (profile) {
          const stats = await fetchUserStats(userId);
          const newFollowing = {
            ...profile,
            followers_count: stats?.followers_count || 0,
            following_count: stats?.following_count || 0,
            posts_count: stats?.posts_count || 0,
            is_following: true,
          };
          setFollowing((prev) => [...prev, newFollowing]);
          setFollowingIds((prev) => new Set([...prev, userId]));
        }
      }

      await fetchSuggestions();

      notifyFollowChange(userId, true);

      return { error: null };
    } catch (error: any) {
      console.error("Takip edilirken hata:", error);
      return { error };
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (error) throw error;

      if (stats) {
        setStats({
          ...stats,
          following_count: Math.max(0, stats.following_count - 1),
        });
      }

      setFollowing((prev) => prev.filter((f) => f.id !== userId));
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      await fetchSuggestions();

      notifyFollowChange(userId, false);

      return { error: null };
    } catch (error: any) {
      console.error("Takipten çıkılırken hata:", error);
      return { error };
    }
  };

  const checkFollowStatus = async (userId: string): Promise<boolean> => {
    if (!user) return false;

    if (followingIds.has(userId)) {
      return true;
    }

    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error("Takip durumu kontrol edilemedi:", error);
      return false;
    }
  };

  const refreshFollowData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchFollowers(user.id),
        fetchFollowing(user.id),
        fetchSuggestions(),
      ]);

      const userStats = await fetchUserStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error("Takip verileri yenilenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshFollowData();
    } else {
      setFollowers([]);
      setFollowing([]);
      setFollowingIds(new Set());
      setSuggestions([]);
      setStats(null);
    }
  }, [user]);

  return (
    <FollowContext.Provider
      value={{
        followers,
        following,
        followingIds,
        suggestions,
        stats,
        loading,
        fetchFollowers,
        fetchFollowing,
        fetchSuggestions,
        fetchUserStats,
        followUser,
        unfollowUser,
        checkFollowStatus,
        refreshFollowData,
        addFollowListener,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
};
