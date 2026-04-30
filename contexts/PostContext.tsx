import { supabase } from "@lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  poll_data: any | null;
  post_type: "text" | "image" | "video" | "poll";
  quoted_post_id: string | null;
  quote_text: string | null;
  created_at: string;
  likes_count: number;
  shares_count: number;
  saves_count: number;
  quotes_count: number;
  comments_count: number;
  username: string;
  avatar_index: number;
  full_name: string | null;
  user_liked: boolean;
  user_shared: boolean;
  user_saved: boolean;
  user_voted_option?: number | null;
  quoted_post?: Post | null;
  is_shared_post?: boolean;
  original_post_id?: string;
  original_user?: {
    id: string;
    username: string;
    avatar_index: number;
  } | null;
};

type PollVotesMap = {
  [key: number]: number;
};

type PostContextType = {
  posts: Post[];
  savedPosts: Post[];
  userPosts: Post[];
  loading: boolean;
  refreshing: boolean;
  hasNewPosts: boolean;
  checkNewPosts: () => Promise<void>;
  clearNewPostsFlag: () => void;
  fetchPosts: (forceRefresh?: boolean) => Promise<void>;
  fetchSavedPosts: (forceRefresh?: boolean) => Promise<void>;
  fetchUserPosts: (userId: string, forceRefresh?: boolean) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  unsharePost: (postId: string) => Promise<void>;
  quotePost: (postId: string, quoteText: string) => Promise<any>;
  savePost: (postId: string) => Promise<void>;
  unsavePost: (postId: string) => Promise<void>;
  votePoll: (postId: string, optionId: number) => Promise<any>;
  createPost: (postData: any) => Promise<any>;
  deletePost: (postId: string) => Promise<any>;
  refreshPosts: () => Promise<void>;
};

const PostContext = createContext<PostContextType>({
  posts: [],
  savedPosts: [],
  userPosts: [],
  loading: false,
  refreshing: false,
  hasNewPosts: false,
  checkNewPosts: async () => {},
  clearNewPostsFlag: () => {},
  fetchPosts: async () => {},
  fetchSavedPosts: async () => {},
  fetchUserPosts: async () => {},
  likePost: async () => {},
  unlikePost: async () => {},
  sharePost: async () => {},
  unsharePost: async () => {},
  quotePost: async () => {},
  savePost: async () => {},
  unsavePost: async () => {},
  votePoll: async () => {},
  createPost: async () => {},
  deletePost: async () => {},
  refreshPosts: async () => {},
});

export const usePosts = () => useContext(PostContext);

// Önbellek anahtarları
const CACHE_KEYS = {
  POSTS: "cached_posts",
  SAVED_POSTS: "cached_saved_posts",
  USER_POSTS: (userId: string) => `cached_user_posts_${userId}`,
};

export const PostProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  // En son getirilen gönderilerin ID'lerini tut
  const lastPostIds = useRef<Set<string>>(new Set());
  // Önbellek temizleme işlemi sadece bir kere yapılsın
  const cacheCleanedRef = useRef(false);

  // Önbelleğe kaydet (hatayı yönet, kullanıcıyı bloke etme)
  const saveToCache = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // Disk dolu veya başka bir hata - sadece logla, uygulamayı durdurma
      console.warn(`Önbelleğe kaydedilemedi (${key}):`, error);
    }
  };

  // Önbellekten yükle (hatayı yönet)
  const loadFromCache = async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn(`Önbellekten yüklenemedi (${key}):`, error);
      return null;
    }
  };

  // Eski ve gereksiz büyük önbellekleri temizle (base64 içerenleri)
  const clearOldCache = async () => {
    if (cacheCleanedRef.current) return;
    cacheCleanedRef.current = true;

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeysToClear = allKeys.filter(
        (key) => key.startsWith("cached_") || key.includes("user_posts_"),
      );
      if (cacheKeysToClear.length > 0) {
        await AsyncStorage.multiRemove(cacheKeysToClear);
        console.log("🗑️ Eski önbellekler temizlendi, disk alanı boşaltıldı.");
      }
    } catch (error) {
      console.warn("Önbellek temizleme sırasında hata:", error);
    }
  };

  // Yeni gönderileri kontrol et
  const checkNewPosts = useCallback(async () => {
    if (!user || posts.length === 0) return;

    try {
      const latestPostDate = posts[0]?.created_at;

      const { data, error } = await supabase
        .from("post_stats")
        .select("id, created_at")
        .gt("created_at", latestPostDate)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setHasNewPosts(true);
      }
    } catch (error) {
      console.error("Yeni gönderi kontrolü başarısız:", error);
    }
  }, [user, posts]);

  // Yeni gönderi bayrağını temizle
  const clearNewPostsFlag = useCallback(() => {
    setHasNewPosts(false);
  }, []);

  // Alıntılanan gönderilerin detaylarını getir (anket verileri dahil)
  const fetchQuotedPosts = async (posts: any[]) => {
    const quotedPostIds = posts
      .filter((p) => p.quoted_post_id)
      .map((p) => p.quoted_post_id);

    if (quotedPostIds.length === 0) return posts;

    const { data: quotedPosts, error } = await supabase
      .from("post_stats")
      .select("*")
      .in("id", quotedPostIds);

    if (error) {
      console.error("Alıntılanan gönderiler alınamadı:", error);
      return posts;
    }

    // Alıntılanan gönderiler için anket oylarını ve kullanıcı oylarını getir
    const quotedPostsWithVotes = await Promise.all(
      (quotedPosts || []).map(async (quotedPost: any) => {
        if (quotedPost.post_type === "poll") {
          const pollVotes = await fetchPollVotes(quotedPost.id);
          let userVote = null;

          if (user) {
            userVote = await fetchUserPollVote(quotedPost.id, user.id);
          }

          // Poll data'yı güncelle
          const updatedPollData = {
            ...quotedPost.poll_data,
            options: quotedPost.poll_data.options.map((opt: any) => ({
              ...opt,
              votes: pollVotes[opt.id] || 0,
            })),
          };

          return {
            ...quotedPost,
            poll_data: updatedPollData,
            user_voted_option: userVote,
          };
        }
        return quotedPost;
      }),
    );

    const quotedPostsMap = new Map(
      quotedPostsWithVotes?.map((qp) => [qp.id, qp]),
    );

    return posts.map((post) => ({
      ...post,
      quoted_post: post.quoted_post_id
        ? quotedPostsMap.get(post.quoted_post_id)
        : null,
    }));
  };

  // Anket oylarını getir
  const fetchPollVotes = async (postId: string): Promise<PollVotesMap> => {
    try {
      const { data, error } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("post_id", postId);

      if (error) throw error;

      const votes: PollVotesMap = {};
      data?.forEach((vote: any) => {
        const optionId = vote.option_id as number;
        votes[optionId] = (votes[optionId] || 0) + 1;
      });

      return votes;
    } catch (error) {
      console.error("Anket oyları alınamadı:", error);
      return {};
    }
  };

  // Kullanıcının anket oyunu getir
  const fetchUserPollVote = async (postId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      return data?.option_id || null;
    } catch (error) {
      console.error("Kullanıcı anket oyu alınamadı:", error);
      return null;
    }
  };

  // Gönderi verilerini anket oylarıyla güncelle
  const updatePostWithPollVotes = async (post: any) => {
    if (post.post_type === "poll") {
      const pollVotes = await fetchPollVotes(post.id);
      let userVote = null;

      if (user) {
        userVote = await fetchUserPollVote(post.id, user.id);
      }

      const updatedPollData = {
        ...post.poll_data,
        options: post.poll_data.options.map((opt: any) => ({
          ...opt,
          votes: pollVotes[opt.id] || 0,
        })),
      };

      return {
        ...post,
        poll_data: updatedPollData,
        user_voted_option: userVote,
      };
    }
    return post;
  };

  const fetchPosts = async (forceRefresh = false) => {
    if (!user) return;

    setLoading(true);
    try {
      // Önbellekten yüklemeyi dene (forceRefresh yoksa)
      if (!forceRefresh) {
        const cachedPosts = await loadFromCache(CACHE_KEYS.POSTS);
        if (cachedPosts && Array.isArray(cachedPosts)) {
          setPosts(cachedPosts);
          lastPostIds.current = new Set(cachedPosts.map((p: Post) => p.id));
        }
      }

      // Supabase'den güncel verileri al
      const { data, error } = await supabase
        .from("post_stats")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Her gönderi için anket oylarını güncelle
      const postsWithPollVotes = await Promise.all(
        (data || []).map(async (post: any) => {
          return await updatePostWithPollVotes(post);
        }),
      );

      // Alıntılanan gönderilerin detaylarını getir
      const postsWithQuotes = await fetchQuotedPosts(postsWithPollVotes);

      // Her gönderi için kullanıcı etkileşimlerini hesapla
      const postsWithDetails = await Promise.all(
        (postsWithQuotes || []).map(async (post: any) => {
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

      // Yeni gönderi var mı kontrol et
      if (posts.length > 0 && postsWithDetails.length > 0) {
        const newPostsExist = postsWithDetails.some(
          (post) => !lastPostIds.current.has(post.id),
        );
        if (newPostsExist) {
          setHasNewPosts(true);
        }
      }

      // Son gönderi ID'lerini güncelle
      lastPostIds.current = new Set(postsWithDetails.map((p) => p.id));

      setPosts(postsWithDetails);

      // Önbelleğe kaydet (hata olsa bile devam et)
      await saveToCache(CACHE_KEYS.POSTS, postsWithDetails);
    } catch (error) {
      console.error("Gönderiler alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async (forceRefresh = false) => {
    if (!user) return;

    try {
      // Önbellekten yüklemeyi dene (forceRefresh yoksa)
      if (!forceRefresh) {
        const cachedSaved = await loadFromCache(CACHE_KEYS.SAVED_POSTS);
        if (cachedSaved && Array.isArray(cachedSaved)) {
          setSavedPosts(cachedSaved);
        }
      }

      const { data, error } = await supabase
        .from("post_saves")
        .select(
          `
          post_id,
          post_stats!post_id (*)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const savedPostsData = (data || [])
        .map((item: any) => {
          const post = item.post_stats;
          return {
            ...post,
            likes_count: 0,
            shares_count: 0,
            saves_count: 0,
            quotes_count: 0,
            comments_count: post.comments_count || 0,
            user_liked: false,
            user_shared: false,
            user_saved: true,
          };
        })
        .filter(Boolean);

      // Her kaydedilen gönderi için anket oylarını güncelle
      const savedPostsWithPollVotes = await Promise.all(
        savedPostsData.map(async (post: any) => {
          return await updatePostWithPollVotes(post);
        }),
      );

      // Alıntılanan gönderilerin detaylarını getir
      const savedPostsWithQuotes = await fetchQuotedPosts(
        savedPostsWithPollVotes,
      );
      setSavedPosts(savedPostsWithQuotes);

      // Önbelleğe kaydet
      await saveToCache(CACHE_KEYS.SAVED_POSTS, savedPostsWithQuotes);
    } catch (error) {
      console.error("Kaydedilen gönderiler alınamadı:", error);
    }
  };

  const fetchUserPosts = async (userId: string, forceRefresh = false) => {
    try {
      // Önbellekten yüklemeyi dene (forceRefresh yoksa)
      if (!forceRefresh) {
        const cachedUserPosts = await loadFromCache(
          CACHE_KEYS.USER_POSTS(userId),
        );
        if (cachedUserPosts && Array.isArray(cachedUserPosts)) {
          setUserPosts(cachedUserPosts);
        }
      }

      // Kullanıcının kendi gönderileri
      const { data: ownPosts, error: ownError } = await supabase
        .from("post_stats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ownError) throw ownError;

      // Her gönderi için anket oylarını güncelle
      const ownPostsWithPollVotes = await Promise.all(
        (ownPosts || []).map(async (post: any) => {
          return await updatePostWithPollVotes(post);
        }),
      );

      // Kullanıcının paylaştığı gönderiler (shares)
      const { data: sharedPosts, error: sharedError } = await supabase
        .from("post_shares")
        .select(
          `
          post_id,
          post_stats!post_id (*)
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (sharedError) throw sharedError;

      const ownPostIds = new Set((ownPosts || []).map((p: any) => p.id));

      // Paylaşılan gönderileri formatla
      const sharedPostsData = (sharedPosts || [])
        .map((item: any) => {
          const post = item.post_stats;
          if (ownPostIds.has(post.id)) return null;
          return {
            ...post,
            is_shared_post: true,
            original_post_id: post.id,
            original_user: {
              id: post.user_id,
              username: post.username,
              avatar_index: post.avatar_index,
            },
          };
        })
        .filter(Boolean);

      // Paylaşılan gönderiler için anket oylarını güncelle
      const sharedPostsWithPollVotes = await Promise.all(
        sharedPostsData.map(async (post: any) => {
          return await updatePostWithPollVotes(post);
        }),
      );

      // Tüm gönderileri birleştir ve kronolojik sırala
      const allUserPosts = [
        ...ownPostsWithPollVotes,
        ...sharedPostsWithPollVotes,
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      // Alıntılanan gönderilerin detaylarını getir
      const userPostsWithQuotes = await fetchQuotedPosts(allUserPosts);
      setUserPosts(userPostsWithQuotes);

      // Önbelleğe kaydet
      await saveToCache(CACHE_KEYS.USER_POSTS(userId), userPostsWithQuotes);
    } catch (error) {
      console.error("Kullanıcı gönderileri alınamadı:", error);
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });

      if (error) throw error;

      // State'i güncelle
      const updatePostInState = (prev: Post[]) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, likes_count: p.likes_count + 1, user_liked: true };
          }
          if (p.quoted_post && p.quoted_post.id === postId) {
            return {
              ...p,
              quoted_post: {
                ...p.quoted_post,
                likes_count: p.quoted_post.likes_count + 1,
                user_liked: true,
              },
            };
          }
          return p;
        });

      setPosts(updatePostInState);
      setUserPosts(updatePostInState);
      setSavedPosts(updatePostInState);

      await saveToCache(CACHE_KEYS.POSTS, posts);
    } catch (error) {
      console.error("Beğeni eklenirken hata:", error);
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      // State'i güncelle
      const updatePostInState = (prev: Post[]) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likes_count: Math.max(0, p.likes_count - 1),
              user_liked: false,
            };
          }
          if (p.quoted_post && p.quoted_post.id === postId) {
            return {
              ...p,
              quoted_post: {
                ...p.quoted_post,
                likes_count: Math.max(0, p.quoted_post.likes_count - 1),
                user_liked: false,
              },
            };
          }
          return p;
        });

      setPosts(updatePostInState);
      setUserPosts(updatePostInState);
      setSavedPosts(updatePostInState);

      await saveToCache(CACHE_KEYS.POSTS, posts);
    } catch (error) {
      console.error("Beğeni kaldırılırken hata:", error);
    }
  };

  const sharePost = async (postId: string) => {
    if (!user) return;

    try {
      const { data: existingShare, error: checkError } = await supabase
        .from("post_shares")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingShare) {
        await unsharePost(postId);
        return;
      }

      const { error } = await supabase
        .from("post_shares")
        .insert({ post_id: postId, user_id: user.id });

      if (error) throw error;

      // State'i güncelle
      const updatePostInState = (prev: Post[]) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              shares_count: p.shares_count + 1,
              user_shared: true,
            };
          }
          if (p.quoted_post && p.quoted_post.id === postId) {
            return {
              ...p,
              quoted_post: {
                ...p.quoted_post,
                shares_count: p.quoted_post.shares_count + 1,
                user_shared: true,
              },
            };
          }
          return p;
        });

      setPosts(updatePostInState);
      setSavedPosts(updatePostInState);

      if (user.id === user.id) {
        await fetchUserPosts(user.id, true);
      }

      await saveToCache(CACHE_KEYS.POSTS, posts);
    } catch (error) {
      console.error("Paylaşım eklenirken hata:", error);
    }
  };

  const unsharePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("post_shares")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      // State'i güncelle
      const updatePostInState = (prev: Post[]) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              shares_count: Math.max(0, p.shares_count - 1),
              user_shared: false,
            };
          }
          if (p.quoted_post && p.quoted_post.id === postId) {
            return {
              ...p,
              quoted_post: {
                ...p.quoted_post,
                shares_count: Math.max(0, p.quoted_post.shares_count - 1),
                user_shared: false,
              },
            };
          }
          return p;
        });

      setPosts(updatePostInState);
      setSavedPosts(updatePostInState);

      setUserPosts((prev) =>
        prev.filter(
          (p) => !(p.is_shared_post && p.original_post_id === postId),
        ),
      );

      await saveToCache(CACHE_KEYS.POSTS, posts);
    } catch (error) {
      console.error("Paylaşım kaldırılırken hata:", error);
    }
  };

  const quotePost = async (postId: string, quoteText: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: "",
          post_type: "text",
          quoted_post_id: postId,
          quote_text: quoteText,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchPosts(true);
      await fetchUserPosts(user.id, true);

      return { data, error: null };
    } catch (error: any) {
      console.error("Alıntı eklenirken hata:", error);
      return { error };
    }
  };

  const votePoll = async (postId: string, optionId: number) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      if (optionId === -1) {
        const { error: deleteError } = await supabase
          .from("poll_votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;

        const updatedVotes = await fetchPollVotes(postId);

        const updatePostInState = (prev: Post[]) =>
          prev.map((p) => {
            if (p.id === postId && p.poll_data) {
              const updatedOptions = p.poll_data.options.map((opt: any) => ({
                ...opt,
                votes: updatedVotes[opt.id] || 0,
              }));

              return {
                ...p,
                poll_data: { ...p.poll_data, options: updatedOptions },
                user_voted_option: null,
              };
            }

            if (p.quoted_post && p.quoted_post.id === postId) {
              const updatedQuotedPost = {
                ...p.quoted_post,
                poll_data: p.quoted_post.poll_data
                  ? {
                      ...p.quoted_post.poll_data,
                      options: p.quoted_post.poll_data.options.map(
                        (opt: any) => ({
                          ...opt,
                          votes: updatedVotes[opt.id] || 0,
                        }),
                      ),
                    }
                  : p.quoted_post.poll_data,
                user_voted_option: null,
              };

              return {
                ...p,
                quoted_post: updatedQuotedPost,
              };
            }

            return p;
          });

        setPosts(updatePostInState);
        setUserPosts(updatePostInState);
        setSavedPosts(updatePostInState);

        await saveToCache(CACHE_KEYS.POSTS, posts);
        return { error: null };
      }

      const { data: existingVote, error: checkError } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingVote) {
        const { error: updateError } = await supabase
          .from("poll_votes")
          .update({ option_id: optionId })
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("poll_votes")
          .insert({ post_id: postId, user_id: user.id, option_id: optionId });

        if (insertError) throw insertError;
      }

      const updatedVotes = await fetchPollVotes(postId);

      const updatePostInState = (prev: Post[]) =>
        prev.map((p) => {
          if (p.id === postId && p.poll_data) {
            const updatedOptions = p.poll_data.options.map((opt: any) => ({
              ...opt,
              votes: updatedVotes[opt.id] || 0,
            }));

            return {
              ...p,
              poll_data: { ...p.poll_data, options: updatedOptions },
              user_voted_option: optionId,
            };
          }

          if (p.quoted_post && p.quoted_post.id === postId) {
            const updatedQuotedPost = {
              ...p.quoted_post,
              poll_data: p.quoted_post.poll_data
                ? {
                    ...p.quoted_post.poll_data,
                    options: p.quoted_post.poll_data.options.map(
                      (opt: any) => ({
                        ...opt,
                        votes: updatedVotes[opt.id] || 0,
                      }),
                    ),
                  }
                : p.quoted_post.poll_data,
              user_voted_option: optionId,
            };

            return {
              ...p,
              quoted_post: updatedQuotedPost,
            };
          }

          return p;
        });

      setPosts(updatePostInState);
      setUserPosts(updatePostInState);
      setSavedPosts(updatePostInState);

      await saveToCache(CACHE_KEYS.POSTS, posts);

      return { error: null };
    } catch (error: any) {
      console.error("Anket oylama hatası:", error);
      return { error };
    }
  };

  const savePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("post_saves")
        .insert({ post_id: postId, user_id: user.id });

      if (error) throw error;

      const updatePostInState = (prev: Post[]) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, saves_count: p.saves_count + 1, user_saved: true };
          }
          if (p.quoted_post && p.quoted_post.id === postId) {
            return {
              ...p,
              quoted_post: {
                ...p.quoted_post,
                saves_count: p.quoted_post.saves_count + 1,
                user_saved: true,
              },
            };
          }
          return p;
        });

      setPosts(updatePostInState);
      setUserPosts(updatePostInState);
      setSavedPosts(updatePostInState);

      await fetchSavedPosts(true);
      await saveToCache(CACHE_KEYS.POSTS, posts);
    } catch (error) {
      console.error("Kaydetme eklenirken hata:", error);
    }
  };

  const unsavePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("post_saves")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      const updatePostInState = (prev: Post[]) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              saves_count: Math.max(0, p.saves_count - 1),
              user_saved: false,
            };
          }
          if (p.quoted_post && p.quoted_post.id === postId) {
            return {
              ...p,
              quoted_post: {
                ...p.quoted_post,
                saves_count: Math.max(0, p.quoted_post.saves_count - 1),
                user_saved: false,
              },
            };
          }
          return p;
        });

      setPosts(updatePostInState);
      setUserPosts(updatePostInState);
      setSavedPosts(updatePostInState);

      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
      await saveToCache(CACHE_KEYS.POSTS, posts);
    } catch (error) {
      console.error("Kaydetme kaldırılırken hata:", error);
    }
  };

  // Görseli Storage'a yükle ve public URL döndür
  const uploadImageToStorage = async (
    uri: string,
    userId: string,
  ): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = uri.split(".").pop() || "jpeg";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, blob, {
          contentType: blob.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Storage yükleme hatası:", error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Görsel yükleme hatası:", err);
      return null;
    }
  };

  const createPost = async (postData: any) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      let imageUrl = null;

      if (postData.image_url) {
        if (
          postData.image_url.startsWith("http://") ||
          postData.image_url.startsWith("https://")
        ) {
          imageUrl = postData.image_url;
        } else {
          console.log(
            "📸 Görsel Storage'a yükleniyor... URI:",
            postData.image_url,
          );
          const uploadedUrl = await uploadImageToStorage(
            postData.image_url,
            user.id,
          );
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
            console.log("✅ Görsel Storage'a yüklendi, URL:", imageUrl);
          } else {
            console.error("❌ Görsel yüklenemedi");
            return { error: { message: "Görsel yüklenirken hata oluştu" } };
          }
        }
      }

      console.log("💾 Veritabanına kaydediliyor...");
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: postData.content || "",
          image_url: imageUrl,
          video_url: postData.video_url,
          poll_data: postData.poll_data,
          post_type: postData.post_type || "text",
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Veritabanı hatası:", error);
        throw error;
      }

      console.log("✅ Gönderi başarıyla oluşturuldu");

      await fetchPosts(true);
      await fetchUserPosts(user.id, true);

      return { data, error: null };
    } catch (error: any) {
      console.error("❌ Gönderi oluşturulurken hata:", error);
      return { data: null, error };
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      const { data: post, error: fetchError } = await supabase
        .from("posts")
        .select("user_id, image_url")
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;

      if (post.user_id !== user.id) {
        return { error: { message: "Bu gönderiyi silme yetkiniz yok" } };
      }

      if (
        post.image_url &&
        post.image_url.includes(
          "supabase.co/storage/v1/object/public/post-images/",
        )
      ) {
        const path = post.image_url.split("/post-images/")[1];
        if (path) {
          await supabase.storage.from("post-images").remove([path]);
          console.log("🗑️ Storage dosyası silindi:", path);
        }
      }

      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));

      await saveToCache(
        CACHE_KEYS.POSTS,
        posts.filter((p) => p.id !== postId),
      );

      console.log("✅ Gönderi başarıyla silindi");
      return { error: null };
    } catch (error: any) {
      console.error("❌ Gönderi silinirken hata:", error);
      return { error };
    }
  };

  const refreshPosts = async () => {
    setRefreshing(true);
    try {
      await fetchPosts(true);
      await fetchSavedPosts(true);
      if (user) {
        await fetchUserPosts(user.id, true);
      }
    } catch (error) {
      console.error("Yenileme sırasında hata:", error);
    } finally {
      setHasNewPosts(false);
      setRefreshing(false);
    }
  };

  // Uygulama başlangıcında eski önbellekleri temizle
  useEffect(() => {
    clearOldCache();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchSavedPosts();
      fetchUserPosts(user.id);

      const interval = setInterval(() => {
        checkNewPosts();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <PostContext.Provider
      value={{
        posts,
        savedPosts,
        userPosts,
        loading,
        refreshing,
        hasNewPosts,
        checkNewPosts,
        clearNewPostsFlag,
        fetchPosts,
        fetchSavedPosts,
        fetchUserPosts,
        likePost,
        unlikePost,
        sharePost,
        unsharePost,
        quotePost,
        savePost,
        unsavePost,
        votePoll,
        createPost,
        deletePost,
        refreshPosts,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
