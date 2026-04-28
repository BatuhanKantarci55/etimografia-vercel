import { supabase } from "@lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  reply_to_user_id?: string | null;
  reply_to_username?: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    avatar_index: number;
    full_name: string | null;
  };
  likes_count: number;
  user_liked: boolean;
  replies?: Comment[];
  replies_count?: number;
  show_replies?: boolean;
};

type CommentContextType = {
  comments: Comment[];
  loading: boolean;
  fetchComments: (postId: string, forceRefresh?: boolean) => Promise<void>;
  addComment: (
    postId: string,
    content: string,
    parentId?: string | null,
    replyToUserId?: string | null,
    replyToUsername?: string | null,
  ) => Promise<any>;
  updateComment: (commentId: string, content: string) => Promise<any>;
  deleteComment: (commentId: string) => Promise<any>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
  toggleReplies: (commentId: string) => void;
  refreshComments: (postId: string) => Promise<void>;
};

const CommentContext = createContext<CommentContextType>({
  comments: [],
  loading: false,
  fetchComments: async () => {},
  addComment: async () => {},
  updateComment: async () => {},
  deleteComment: async () => {},
  likeComment: async () => {},
  unlikeComment: async () => {},
  toggleReplies: () => {},
  refreshComments: async () => {},
});

export const useComments = () => useContext(CommentContext);

// Önbellek anahtarı
const CACHE_KEYS = {
  COMMENTS: (postId: string) => `cached_comments_${postId}`,
};

export const CommentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  // Önbelleğe kaydet
  const saveToCache = async (postId: string, data: any) => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEYS.COMMENTS(postId),
        JSON.stringify(data),
      );
    } catch (error) {
      console.error("Yorumlar önbelleğe kaydedilemedi:", error);
    }
  };

  // Önbellekten yükle
  const loadFromCache = async (postId: string) => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.COMMENTS(postId));
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Yorumlar önbellekten yüklenemedi:", error);
      return null;
    }
  };

  const fetchProfileById = async (userId: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_index, full_name")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Profil bilgisi alınamadı:", error);
      return null;
    }
  };

  // Toplam yanıt sayısını hesapla (recursive)
  const calculateTotalReplies = (replies: Comment[]): number => {
    let count = replies.length;
    replies.forEach((reply) => {
      if (reply.replies && reply.replies.length > 0) {
        count += calculateTotalReplies(reply.replies);
      }
    });
    return count;
  };

  // Tüm yanıtları recursive olarak getir
  const fetchAllReplies = async (parentId: string): Promise<Comment[]> => {
    try {
      const { data: repliesData, error: repliesError } = await supabase
        .from("comments")
        .select("*")
        .eq("parent_id", parentId)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;

      if (!repliesData || repliesData.length === 0) return [];

      const repliesWithDetails = await Promise.all(
        repliesData.map(async (reply: any) => {
          const profile = await fetchProfileById(reply.user_id);

          const { count: likesCount, error: likesError } = await supabase
            .from("comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", reply.id);

          if (likesError) throw likesError;

          let userLiked = false;
          if (user) {
            const { data: liked, error: likedError } = await supabase
              .from("comment_likes")
              .select("id")
              .eq("comment_id", reply.id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (likedError) throw likedError;
            userLiked = !!liked;
          }

          // Alt yanıtları recursive olarak getir
          const childReplies = await fetchAllReplies(reply.id);

          return {
            ...reply,
            user: profile || {
              id: reply.user_id,
              username: "Kullanıcı",
              avatar_index: 0,
              full_name: null,
            },
            likes_count: likesCount || 0,
            user_liked: userLiked,
            replies: childReplies,
            show_replies: false,
          };
        }),
      );

      return repliesWithDetails;
    } catch (error) {
      console.error("Yanıtlar alınamadı:", error);
      return [];
    }
  };

  const fetchComments = async (
    postId: string,
    forceRefresh: boolean = false,
  ) => {
    setLoading(true);

    try {
      // Önbellekten yüklemeyi dene (forceRefresh yoksa)
      if (!forceRefresh) {
        const cachedComments = await loadFromCache(postId);
        if (cachedComments) {
          setComments(cachedComments);
          setLoading(false);

          // Arka planda güncelle
          fetchFreshComments(postId);
          return;
        }
      }

      // Yeni verileri getir
      await fetchFreshComments(postId);
    } catch (error) {
      console.error("Yorumlar alınamadı:", error);
      setLoading(false);
    }
  };

  // Taze verileri getir (arka plan için)
  const fetchFreshComments = async (postId: string) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        await saveToCache(postId, []);
        setLoading(false);
        return;
      }

      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment: any) => {
          const profile = await fetchProfileById(comment.user_id);

          const { count: likesCount, error: likesError } = await supabase
            .from("comment_likes")
            .select("*", { count: "exact", head: true })
            .eq("comment_id", comment.id);

          if (likesError) throw likesError;

          let userLiked = false;
          if (user) {
            const { data: liked, error: likedError } = await supabase
              .from("comment_likes")
              .select("id")
              .eq("comment_id", comment.id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (likedError) throw likedError;
            userLiked = !!liked;
          }

          // Tüm yanıtları recursive olarak getir
          const replies = await fetchAllReplies(comment.id);

          // Toplam yanıt sayısını hesapla
          const totalReplies = calculateTotalReplies(replies);

          return {
            ...comment,
            user: profile || {
              id: comment.user_id,
              username: "Kullanıcı",
              avatar_index: 0,
              full_name: null,
            },
            likes_count: likesCount || 0,
            user_liked: userLiked,
            replies: replies,
            replies_count: totalReplies,
            show_replies: false,
          };
        }),
      );

      setComments(commentsWithDetails);
      await saveToCache(postId, commentsWithDetails);
    } catch (error) {
      console.error("Taze yorumlar alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (
    postId: string,
    content: string,
    parentId: string | null = null,
    replyToUserId: string | null = null,
    replyToUsername: string | null = null,
  ) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };
    if (!content.trim()) return { error: { message: "Yorum boş olamaz" } };

    try {
      let finalContent = content.trim();
      if (replyToUsername) {
        if (!finalContent.startsWith(`@${replyToUsername}`)) {
          finalContent = `@${replyToUsername} ${finalContent}`;
        }
      }

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: finalContent,
          parent_id: parentId,
          reply_to_user_id: replyToUserId,
          reply_to_username: replyToUsername,
        })
        .select()
        .single();

      if (error) throw error;

      const profile = await fetchProfileById(user.id);

      const newComment = {
        ...data,
        user: profile || {
          id: user.id,
          username: user.user_metadata?.username || "Kullanıcı",
          avatar_index: 0,
          full_name: null,
        },
        likes_count: 0,
        user_liked: false,
        replies: [],
        show_replies: false,
      };

      if (parentId) {
        // Recursive olarak doğru parent'ı bul ve yanıtı ekle
        const addReplyToParent = (comments: Comment[]): Comment[] => {
          return comments.map((c) => {
            if (c.id === parentId) {
              const updatedReplies = [...(c.replies || []), newComment];
              return {
                ...c,
                replies: updatedReplies,
                replies_count: calculateTotalReplies(updatedReplies),
              };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: addReplyToParent(c.replies),
                replies_count: calculateTotalReplies(c.replies),
              };
            }
            return c;
          });
        };

        setComments((prev) => {
          const updated = addReplyToParent(prev);
          saveToCache(postId, updated);
          return updated;
        });
      } else {
        setComments((prev) => {
          const updated = [newComment, ...prev];
          saveToCache(postId, updated);
          return updated;
        });
      }

      return { data: newComment, error: null };
    } catch (error: any) {
      console.error("Yorum eklenirken hata:", error);
      return { error };
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };
    if (!content.trim()) return { error: { message: "Yorum boş olamaz" } };

    try {
      const { data, error } = await supabase
        .from("comments")
        .update({
          content: content.trim(),
          updated_at: new Date(),
        })
        .eq("id", commentId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Recursive olarak yorumu güncelle
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map((c) => {
          if (c.id === commentId) {
            return { ...c, content: data.content };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: updateCommentInTree(c.replies),
            };
          }
          return c;
        });
      };

      setComments((prev) => {
        const updated = updateCommentInTree(prev);
        // PostId'yi bulmak için ilk yorumun post_id'sini kullan
        if (prev.length > 0) {
          saveToCache(prev[0].post_id, updated);
        }
        return updated;
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Yorum güncellenirken hata:", error);
      return { error };
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Recursive olarak yorumu sil
      const deleteCommentFromTree = (comments: Comment[]): Comment[] => {
        return comments.reduce((acc: Comment[], c) => {
          if (c.id === commentId) {
            return acc; // Bu yorumu atla
          }
          if (c.replies && c.replies.length > 0) {
            const updatedReplies = deleteCommentFromTree(c.replies);
            acc.push({
              ...c,
              replies: updatedReplies,
              replies_count: calculateTotalReplies(updatedReplies),
            });
          } else {
            acc.push(c);
          }
          return acc;
        }, []);
      };

      setComments((prev) => {
        const updated = deleteCommentFromTree(prev);
        if (prev.length > 0) {
          saveToCache(prev[0].post_id, updated);
        }
        return updated;
      });

      return { error: null };
    } catch (error: any) {
      console.error("Yorum silinirken hata:", error);
      return { error };
    }
  };

  const likeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });

      if (error) throw error;

      const updateLikesInTree = (comments: Comment[]): Comment[] => {
        return comments.map((c) => {
          if (c.id === commentId) {
            return { ...c, likes_count: c.likes_count + 1, user_liked: true };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: updateLikesInTree(c.replies),
            };
          }
          return c;
        });
      };

      setComments((prev) => {
        const updated = updateLikesInTree(prev);
        if (prev.length > 0) {
          saveToCache(prev[0].post_id, updated);
        }
        return updated;
      });
    } catch (error) {
      console.error("Yorum beğenilirken hata:", error);
    }
  };

  const unlikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      const updateLikesInTree = (comments: Comment[]): Comment[] => {
        return comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              likes_count: Math.max(0, c.likes_count - 1),
              user_liked: false,
            };
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: updateLikesInTree(c.replies),
            };
          }
          return c;
        });
      };

      setComments((prev) => {
        const updated = updateLikesInTree(prev);
        if (prev.length > 0) {
          saveToCache(prev[0].post_id, updated);
        }
        return updated;
      });
    } catch (error) {
      console.error("Yorum beğenisi kaldırılırken hata:", error);
    }
  };

  const toggleReplies = (commentId: string) => {
    const toggleInTree = (comments: Comment[]): Comment[] => {
      return comments.map((c) => {
        if (c.id === commentId) {
          return { ...c, show_replies: !c.show_replies };
        }
        if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: toggleInTree(c.replies),
          };
        }
        return c;
      });
    };

    setComments((prev) => toggleInTree(prev));
  };

  const refreshComments = async (postId: string) => {
    await fetchComments(postId, true); // forceRefresh = true
  };

  return (
    <CommentContext.Provider
      value={{
        comments,
        loading,
        fetchComments,
        addComment,
        updateComment,
        deleteComment,
        likeComment,
        unlikeComment,
        toggleReplies,
        refreshComments,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
};
