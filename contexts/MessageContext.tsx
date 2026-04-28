import { supabase } from "@lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type Conversation = {
  id: string;
  type: "direct" | "group";
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_sender_id: string | null;
  last_message_at: string | null;
  participants: ConversationParticipant[];
  other_user?: {
    id: string;
    username: string;
    avatar_index: number;
    full_name: string | null;
    is_online?: boolean;
  };
  unread_count: number;
  last_read_at?: string;
  is_muted?: boolean;
  is_archived?: boolean;
};

export type ConversationParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  is_archived: boolean;
  user?: {
    id: string;
    username: string;
    avatar_index: number;
    full_name: string | null;
  };
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  reply_to_message_id: string | null;
  type: "text" | "sticker" | "post" | "image" | "video";
  content: string | null;
  metadata: any;
  is_edited: boolean;
  deleted_for_everyone: boolean;
  deleted_for_sender: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_index: number;
  };
  reply_to?: Message | null;
  reactions?: MessageReaction[];
  status?: {
    delivered?: boolean;
    read?: boolean;
    read_at?: string;
  };
};

export type MessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: {
    username: string;
  };
};

export type MessageStatus = {
  message_id: string;
  user_id: string;
  status: "delivered" | "read";
  read_at: string | null;
};

type MessageContextType = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;

  // Sohbet işlemleri
  fetchConversations: (forceRefresh?: boolean) => Promise<void>;
  createConversation: (userId: string) => Promise<Conversation | null>;
  getConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string, mute: boolean) => Promise<void>;

  // Mesaj işlemleri
  fetchMessages: (
    conversationId: string,
    page?: number,
    forceRefresh?: boolean,
  ) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    type?: string,
    replyToId?: string | null,
  ) => Promise<any>;
  editMessage: (messageId: string, newContent: string) => Promise<any>;
  deleteForEveryone: (messageId: string) => Promise<any>;
  deleteForMe: (messageId: string) => Promise<any>;
  replyToMessage: (messageId: string) => void;

  // Tepki işlemleri
  addReaction: (messageId: string, reaction: string) => Promise<any>;
  removeReaction: (messageId: string) => Promise<any>;

  // Okundu bilgisi
  markAsRead: (conversationId: string, messageIds: string[]) => Promise<void>;

  // Gönderi paylaşımı
  sharePost: (postId: string, conversationId: string) => Promise<any>;

  // Realtime
  subscribeToConversation: (conversationId: string) => () => void;

  // State management
  setCurrentConversation: (conversation: Conversation | null) => void;
  clearMessages: () => void;
};

const MessageContext = createContext<MessageContextType>({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  refreshing: false,
  hasMore: true,

  fetchConversations: async () => {},
  createConversation: async () => null,
  getConversation: async () => {},
  archiveConversation: async () => {},
  muteConversation: async () => {},

  fetchMessages: async () => {},
  sendMessage: async () => {},
  editMessage: async () => {},
  deleteForEveryone: async () => {},
  deleteForMe: async () => {},
  replyToMessage: () => {},

  addReaction: async () => {},
  removeReaction: async () => {},

  markAsRead: async () => {},

  sharePost: async () => {},

  subscribeToConversation: () => () => {},

  setCurrentConversation: () => {},
  clearMessages: () => {},
});

export const useMessages = () => useContext(MessageContext);

const CACHE_KEYS = {
  CONVERSATIONS: "cached_conversations",
  MESSAGES: (convId: string) => `cached_messages_${convId}`,
};

export const MessageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [messagePage, setMessagePage] = useState(1);

  // Realtime subscription'ları tut
  const [subscriptions, setSubscriptions] = useState<{ [key: string]: any }>(
    {},
  );

  // Önbelleğe kaydet
  const saveToCache = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Önbelleğe kaydedilemedi:", error);
    }
  };

  // Önbellekten yükle
  const loadFromCache = async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Önbellekten yüklenemedi:", error);
      return null;
    }
  };

  // Profil bilgilerini getir
  const fetchProfileById = async (userId: string) => {
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

  // Taze sohbetler getir
  const fetchFreshConversations = async () => {
    if (!user) return;

    try {
      console.log("📥 Taze sohbetler getiriliyor...");

      // Katılımcısı olduğu sohbet ID'lerini getir
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at, is_muted, is_archived")
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        return;
      }

      const conversationIds = participantData.map((p) => p.conversation_id);

      // Sohbet bilgilerini getir
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      console.log("Sohbetler ham veri:", conversations);

      // Her sohbet için detayları getir
      const conversationsWithDetails = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Bu sohbetin katılımcılarını getir
          const { data: parts } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id);

          // Diğer kullanıcının ID'sini bul
          const otherUserId = parts?.find(
            (p) => p.user_id !== user!.id,
          )?.user_id;

          // Diğer kullanıcının profilini getir
          let otherUser = null;
          if (otherUserId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, username, avatar_index, full_name")
              .eq("id", otherUserId)
              .single();
            otherUser = profile;
          }

          // Bu sohbet için katılımcı bilgilerini bul
          const participantInfo = participantData.find(
            (p) => p.conversation_id === conv.id,
          );

          // EN SON MESAJI GETİR (benim için silinmemiş olanları dikkate al)
          const { data: latestMessage, error: latestError } = await supabase
            .from("messages")
            .select("content, sender_id, created_at, type, metadata")
            .eq("conversation_id", conv.id)
            .eq("deleted_for_everyone", false)
            .eq("deleted_for_sender", false)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestError) {
            console.error("Son mesaj getirilemedi:", latestError);
          }

          console.log(`Sohbet ${conv.id} için son mesaj:`, latestMessage);

          // Okunmamış mesaj sayısını hesapla
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .gt("created_at", participantInfo?.last_read_at || "1970-01-01")
            .neq("sender_id", user!.id)
            .eq("deleted_for_everyone", false)
            .eq("deleted_for_sender", false);

          let lastMessageContent = null;
          let lastMessageSenderId = null;
          let lastMessageAt = null;

          if (latestMessage) {
            lastMessageContent = latestMessage.content;
            lastMessageSenderId = latestMessage.sender_id;
            lastMessageAt = latestMessage.created_at;

            // Eğer content boşsa ve type 'post' ise, bu bir gönderi
            if (!lastMessageContent && latestMessage.type === "post") {
              console.log("📸 Gönderi mesajı tespit edildi:", latestMessage);
            }
          }

          return {
            ...conv,
            last_message: lastMessageContent,
            last_message_sender_id: lastMessageSenderId,
            last_message_at: lastMessageAt,
            last_message_type: latestMessage?.type, // Mesaj tipini de ekle
            other_user: otherUser,
            unread_count: unreadCount || 0,
            last_read_at: participantInfo?.last_read_at,
            is_muted: participantInfo?.is_muted,
            is_archived: participantInfo?.is_archived,
          };
        }),
      );

      console.log("Sohbetler işlenmiş:", conversationsWithDetails);
      setConversations(conversationsWithDetails);
      await saveToCache(CACHE_KEYS.CONVERSATIONS, conversationsWithDetails);
    } catch (error) {
      console.error("Taze sohbetler alınamadı:", error);
      throw error;
    }
  };

  // Sohbetleri getir (önbellek ile)
  const fetchConversations = async (forceRefresh = false) => {
    if (!user) return;

    setLoading(true);
    try {
      if (!forceRefresh) {
        const cached = await loadFromCache(CACHE_KEYS.CONVERSATIONS);
        if (cached && cached.length > 0) {
          console.log("Sohbetler önbellekten yüklendi:", cached.length);
          setConversations(cached);
          setLoading(false);

          // Arka planda güncelle
          fetchFreshConversations().catch(console.error);
          return;
        }
      }

      await fetchFreshConversations();
    } catch (error) {
      console.error("Sohbetler alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  // Yeni sohbet oluştur
  const createConversation = async (
    targetUserId: string,
  ): Promise<Conversation | null> => {
    if (!user) return null;

    try {
      console.log("🚀 Yeni sohbet oluşturuluyor...", {
        currentUser: user.id,
        targetUser: targetUserId,
      });

      // Önce kullanıcının katılımcı olduğu tüm sohbetleri getir
      const { data: myConversations, error: myConvError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvError) {
        console.error("❌ Mevcut sohbetler alınamadı:", myConvError);
        throw myConvError;
      }

      console.log("Mevcut sohbet ID'leri:", myConversations);

      // Eğer hiç sohbet yoksa direkt yeni oluştur
      if (!myConversations || myConversations.length === 0) {
        console.log("Hiç sohbet yok, yeni oluşturuluyor...");
        return await createNewConversation(targetUserId);
      }

      const conversationIds = myConversations.map((c) => c.conversation_id);

      // Bu sohbetlerden direkt tipinde olanları bul
      const { data: directConvs, error: directError } = await supabase
        .from("conversations")
        .select("id")
        .in("id", conversationIds)
        .eq("type", "direct");

      if (directError) {
        console.error("❌ Direkt sohbetler alınamadı:", directError);
        throw directError;
      }

      console.log("Direkt sohbet ID'leri:", directConvs);

      if (directConvs && directConvs.length > 0) {
        const directConvIds = directConvs.map((c) => c.id);

        // Bu direkt sohbetlerde targetUserId'nin katılımcı olup olmadığını kontrol et
        const { data: existingParticipant, error: existingError } =
          await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .in("conversation_id", directConvIds)
            .eq("user_id", targetUserId)
            .maybeSingle();

        if (existingError) {
          console.error("❌ Katılımcı kontrolü hatası:", existingError);
          throw existingError;
        }

        if (existingParticipant) {
          console.log(
            "✅ Mevcut sohbet bulundu:",
            existingParticipant.conversation_id,
          );
          await getConversation(existingParticipant.conversation_id);
          // Sohbet listesini güncelle
          await fetchConversations(true);
          return { id: existingParticipant.conversation_id } as Conversation;
        }
      }

      // Mevcut sohbet yoksa yeni oluştur
      console.log("📝 Mevcut sohbet bulunamadı, yeni oluşturuluyor...");
      return await createNewConversation(targetUserId);
    } catch (error) {
      console.error("💥 Sohbet oluşturulamadı:", error);
      return null;
    }
  };

  // Yeni sohbet oluşturma yardımcı fonksiyonu
  const createNewConversation = async (
    targetUserId: string,
  ): Promise<Conversation | null> => {
    if (!user) return null;

    try {
      // Yeni sohbet oluştur
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          type: "direct",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) {
        console.error("❌ Sohbet oluşturma hatası:", convError);
        throw convError;
      }

      console.log("✅ Yeni sohbet oluşturuldu:", newConv);

      // Katılımcıları ekle
      const participants = [
        {
          conversation_id: newConv.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          last_read_at: new Date().toISOString(),
          is_muted: false,
          is_archived: false,
        },
        {
          conversation_id: newConv.id,
          user_id: targetUserId,
          joined_at: new Date().toISOString(),
          last_read_at: new Date().toISOString(),
          is_muted: false,
          is_archived: false,
        },
      ];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (partError) {
        console.error("❌ Katılımcı ekleme hatası:", partError);
        // Sohbeti geri al
        await supabase.from("conversations").delete().eq("id", newConv.id);
        throw partError;
      }

      console.log("✅ Katılımcılar eklendi");

      // Yeni sohbeti getir
      await getConversation(newConv.id);
      await fetchConversations(true);

      return newConv;
    } catch (error) {
      console.error("💥 Yeni sohbet oluşturulamadı:", error);
      return null;
    }
  };

  // Tekil sohbet detayını getir
  const getConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      console.log("Sohbet detayı getiriliyor:", conversationId);

      // Sohbet bilgilerini getir
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;

      // Katılımcıları getir
      const { data: participants, error: partError } = await supabase
        .from("conversation_participants")
        .select("user_id, last_read_at, is_muted, is_archived")
        .eq("conversation_id", conversationId);

      if (partError) throw partError;

      // Her katılımcı için profil bilgilerini getir
      const participantsWithProfiles = await Promise.all(
        (participants || []).map(async (p) => {
          const profile = await fetchProfileById(p.user_id);
          return {
            ...p,
            user: profile,
          };
        }),
      );

      // Diğer kullanıcıyı bul
      const otherParticipant = participantsWithProfiles.find(
        (p) => p.user_id !== user.id,
      );

      const conversationWithDetails = {
        ...conversation,
        participants: participantsWithProfiles,
        other_user: otherParticipant?.user || null,
      };

      console.log("Sohbet detayı:", conversationWithDetails);
      setCurrentConversation(conversationWithDetails);

      // Mesajları getir
      await fetchMessages(conversationId, 1, true);

      // Realtime subscription başlat
      subscribeToConversation(conversationId);
    } catch (error) {
      console.error("Sohbet detayı alınamadı:", error);
    }
  };

  // Taze mesajları getir
  const fetchFreshMessages = async (
    conversationId: string,
    page: number = 1,
  ) => {
    if (!user) return;

    try {
      const pageSize = 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      console.log("📥 Taze mesajlar getiriliyor:", { conversationId, page });

      const {
        data: messagesData,
        error: messagesError,
        count,
      } = await supabase
        .from("messages")
        .select("*", { count: "exact" })
        .eq("conversation_id", conversationId)
        .eq("deleted_for_everyone", false)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (messagesError) throw messagesError;

      console.log(`${messagesData?.length || 0} mesaj bulundu`);

      // Her mesaj için gönderen bilgilerini getir
      const messagesWithDetails = await Promise.all(
        (messagesData || []).map(async (message: any) => {
          // Gönderen profili
          let sender = null;
          if (message.sender_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, username, avatar_index")
              .eq("id", message.sender_id)
              .single();
            sender = profile;
          }

          // Cevap verilen mesaj
          let replyTo = null;
          if (message.reply_to_message_id) {
            const { data: replyMessage } = await supabase
              .from("messages")
              .select("id, content, sender_id")
              .eq("id", message.reply_to_message_id)
              .single();

            if (replyMessage) {
              const { data: replySender } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", replyMessage.sender_id)
                .single();

              replyTo = {
                ...replyMessage,
                sender: replySender,
              };
            }
          }

          // Tepkiler
          const { data: reactions } = await supabase
            .from("message_reactions")
            .select(
              `
              id,
              user_id,
              reaction,
              created_at,
              profiles!user_id (
                username
              )
            `,
            )
            .eq("message_id", message.id);

          // Okunma durumu
          const { data: status } = await supabase
            .from("message_status")
            .select("status, read_at")
            .eq("message_id", message.id)
            .eq("user_id", user!.id)
            .maybeSingle();

          return {
            ...message,
            sender,
            reply_to: replyTo,
            reactions: reactions || [],
            status: status || { status: "delivered", read_at: null },
          };
        }),
      );

      // Tarihe göre sırala (eskiden yeniye)
      const sortedMessages = messagesWithDetails.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      const hasMoreData = count ? count > page * pageSize : false;

      if (page === 1) {
        setMessages(sortedMessages);
      } else {
        setMessages((prev) => [...prev, ...sortedMessages]);
      }

      setHasMore(hasMoreData);
      setMessagePage(page);

      // Önbelleğe kaydet (sadece ilk sayfa)
      if (page === 1) {
        await saveToCache(CACHE_KEYS.MESSAGES(conversationId), sortedMessages);
      }

      // Mesajları okundu olarak işaretle
      const unreadMessageIds =
        messagesData
          ?.filter((m) => m.sender_id !== user!.id)
          .map((m) => m.id) || [];

      if (unreadMessageIds.length > 0) {
        await markAsRead(conversationId, unreadMessageIds);
      }
    } catch (error) {
      console.error("Taze mesajlar alınamadı:", error);
      throw error;
    }
  };

  // Mesajları getir (önbellek ile)
  const fetchMessages = async (
    conversationId: string,
    page: number = 1,
    forceRefresh = false,
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      // Önbellekten yüklemeyi dene (sadece ilk sayfa ve forceRefresh yoksa)
      if (page === 1 && !forceRefresh) {
        const cached = await loadFromCache(CACHE_KEYS.MESSAGES(conversationId));
        if (cached && cached.length > 0) {
          console.log("Mesajlar önbellekten yüklendi:", cached.length);
          setMessages(cached);
          setLoading(false);

          // Arka planda güncelle
          fetchFreshMessages(conversationId, page).catch(console.error);
          return;
        }
      }

      await fetchFreshMessages(conversationId, page);
    } catch (error) {
      console.error("Mesajlar alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mesaj gönder
  const sendMessage = async (
    conversationId: string,
    content: string,
    type: string = "text",
    replyToId: string | null = null,
  ) => {
    if (!user || !content.trim())
      return { error: { message: "Mesaj boş olamaz" } };

    try {
      console.log("📤 Mesaj gönderiliyor:", {
        conversationId,
        content,
        type,
        replyToId,
      });

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          reply_to_message_id: replyToId,
          type: type,
          content: content.trim(),
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (messageError) {
        console.error("❌ Mesaj ekleme hatası:", messageError);
        throw messageError;
      }

      console.log("✅ Mesaj eklendi:", messageData);

      // Mesaj eklendikten hemen sonra conversation'ı kontrol et
      const { data: updatedConv, error: updateError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (!updateError) {
        console.log("📝 Güncellenmiş sohbet:", updatedConv);
      }

      // Gönderen bilgilerini getir
      const { data: senderData, error: senderError } = await supabase
        .from("profiles")
        .select("id, username, avatar_index")
        .eq("id", user.id)
        .single();

      if (senderError) {
        console.error("❌ Gönderen bilgileri alınamadı:", senderError);
      }

      // Cevap verilen mesaj varsa bilgilerini getir
      let replyToData = null;
      if (replyToId) {
        const { data: replyMessage } = await supabase
          .from("messages")
          .select("id, content, sender_id")
          .eq("id", replyToId)
          .single();

        if (replyMessage) {
          const { data: replySender } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", replyMessage.sender_id)
            .single();

          replyToData = {
            ...replyMessage,
            sender: replySender,
          };
        }
      }

      const newMessage = {
        ...messageData,
        sender: senderData,
        reply_to: replyToData,
        reactions: [],
        status: { status: "delivered", read_at: null },
      };

      setMessages((prev) => [...prev, newMessage]);

      // Sohbet listesini güncelle
      await fetchFreshConversations();

      return { data: newMessage, error: null };
    } catch (error: any) {
      console.error("❌ Mesaj gönderilemedi:", error);
      return { error };
    }
  };

  // Mesaj düzenle
  const editMessage = async (messageId: string, newContent: string) => {
    if (!user || !newContent.trim())
      return { error: { message: "Mesaj boş olamaz" } };

    try {
      const { data, error } = await supabase
        .from("messages")
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: data.content, is_edited: true }
            : m,
        ),
      );

      return { data, error: null };
    } catch (error: any) {
      console.error("Mesaj düzenlenemedi:", error);
      return { error };
    }
  };

  // Herkesten sil
  const deleteForEveryone = async (messageId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      console.log("🗑️ Herkesten silme işlemi başlatıldı:", messageId);

      // Önce mesajın bu kullanıcıya ait olduğunu kontrol et
      const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("sender_id, conversation_id")
        .eq("id", messageId)
        .single();

      if (fetchError) throw fetchError;

      if (message.sender_id !== user.id) {
        return { error: { message: "Bu mesajı silme yetkiniz yok" } };
      }

      // Mesajı herkes için sil
      const { error } = await supabase
        .from("messages")
        .update({
          deleted_for_everyone: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;

      console.log("✅ Mesaj herkesten silindi:", messageId);

      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      // Sohbet listesini güncelle (son mesaj değişmiş olabilir)
      await fetchFreshConversations();

      return { error: null };
    } catch (error: any) {
      console.error("❌ Mesaj silinemedi:", error);
      return { error };
    }
  };

  // Sadece benden sil
  const deleteForMe = async (messageId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      console.log("🗑️ Sadece benden silme işlemi başlatıldı:", messageId);

      // Önce mesajın conversation_id'sini al
      const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("id", messageId)
        .single();

      if (fetchError) throw fetchError;

      // Mesajı sadece kendim için sil
      const { error } = await supabase
        .from("messages")
        .update({
          deleted_for_sender: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;

      console.log("✅ Mesaj sadece benden silindi:", messageId);

      // State'ten kaldır
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      // Sohbet listesini güncelle (son mesaj değişmiş olabilir)
      await fetchFreshConversations();

      return { error: null };
    } catch (error: any) {
      console.error("❌ Mesaj silinemedi:", error);
      return { error };
    }
  };

  // Mesaja cevap ver (state'e replyToMessageId set edilir)
  const replyToMessage = (messageId: string) => {
    // Bu fonksiyon MessageInput'ta replyToMessageId state'ini günceller
    // Global state'de tutmuyoruz, component state'inde tutacağız
  };

  // Tepki ekle
  const addReaction = async (messageId: string, reaction: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      // Önce mevcut tepki var mı kontrol et
      const { data: existing, error: checkError } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Tepki varsa güncelle
        const { error: updateError } = await supabase
          .from("message_reactions")
          .update({ reaction })
          .eq("id", existing.id);

        if (updateError) throw updateError;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId && m.reactions) {
              const updatedReactions = m.reactions.map((r) =>
                r.user_id === user!.id ? { ...r, reaction } : r,
              );
              return { ...m, reactions: updatedReactions };
            }
            return m;
          }),
        );
      } else {
        // Yeni tepki ekle
        const { data, error } = await supabase
          .from("message_reactions")
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction,
            created_at: new Date().toISOString(),
          })
          .select(
            `
            *,
            user:profiles!user_id (
              username
            )
          `,
          )
          .single();

        if (error) throw error;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) {
              const reactions = m.reactions || [];
              return { ...m, reactions: [...reactions, data] };
            }
            return m;
          }),
        );
      }

      return { error: null };
    } catch (error: any) {
      console.error("Tepki eklenemedi:", error);
      return { error };
    }
  };

  // Tepki kaldır
  const removeReaction = async (messageId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId && m.reactions) {
            const filteredReactions = m.reactions.filter(
              (r) => r.user_id !== user!.id,
            );
            return { ...m, reactions: filteredReactions };
          }
          return m;
        }),
      );

      return { error: null };
    } catch (error: any) {
      console.error("Tepki kaldırılamadı:", error);
      return { error };
    }
  };

  // Mesajları okundu işaretle
  const markAsRead = async (conversationId: string, messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    try {
      // Katılımcı kaydını güncelle
      const { error: partError } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (partError) throw partError;

      // Mesaj durumlarını ekle
      const statusInserts = messageIds.map((messageId) => ({
        message_id: messageId,
        user_id: user.id,
        status: "read",
        read_at: new Date().toISOString(),
      }));

      const { error: statusError } = await supabase
        .from("message_status")
        .upsert(statusInserts, { onConflict: "message_id, user_id" });

      if (statusError) throw statusError;

      // Sohbet listesindeki okunmamış sayısını güncelle
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return { ...c, unread_count: 0 };
          }
          return c;
        }),
      );
    } catch (error) {
      console.error("Okundu işaretlenemedi:", error);
    }
  };

  // Gönderi paylaş
  const sharePost = async (postId: string, conversationId: string) => {
    if (!user) return { error: { message: "Kullanıcı bulunamadı" } };

    try {
      console.log("📤 Gönderi paylaşılıyor:", { postId, conversationId });

      // Gönderi bilgilerini getir
      const { data: post, error: postError } = await supabase
        .from("post_stats")
        .select("*")
        .eq("id", postId)
        .single();

      if (postError) {
        console.error("❌ Gönderi bilgileri alınamadı:", postError);
        throw postError;
      }

      console.log("✅ Gönderi bilgileri alındı:", post);

      // Mesaj olarak gönder
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          type: "post",
          content: "",
          metadata: {
            post_id: postId,
            post_type: post.post_type,
            content: post.content,
            image_url: post.image_url,
            username: post.username,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (messageError) {
        console.error("❌ Mesaj ekleme hatası:", messageError);
        throw messageError;
      }

      console.log("✅ Mesaj eklendi:", messageData);

      // Gönderen bilgilerini getir
      const { data: senderData } = await supabase
        .from("profiles")
        .select("id, username, avatar_index")
        .eq("id", user.id)
        .single();

      const newMessage = {
        ...messageData,
        sender: senderData,
        reactions: [],
        status: { status: "delivered", read_at: null },
      };

      // State'i güncelle
      setMessages((prev) => [...prev, newMessage]);

      // Sohbet listesini güncelle
      await fetchFreshConversations();

      return { data: newMessage, error: null };
    } catch (error: any) {
      console.error("❌ Gönderi paylaşılamadı:", error);
      return { error };
    }
  };

  // Realtime subscription
  const subscribeToConversation = (conversationId: string) => {
    if (!user) return () => {};

    if (subscriptions[conversationId]) {
      return () => {};
    }

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Yeni mesaj geldi
          const newMessage = payload.new as any;

          // Eğer mesaj zaten varsa ekleme
          if (messages.some((m) => m.id === newMessage.id)) return;

          // Sender bilgilerini getir
          const sender = await fetchProfileById(newMessage.sender_id);

          const messageWithDetails = {
            ...newMessage,
            sender,
            reactions: [],
          };

          setMessages((prev) => [...prev, messageWithDetails]);

          // Sohbet listesini güncelle
          await fetchFreshConversations();

          // Eğer mesajı gönderen ben değilsem, okundu işaretle
          if (newMessage.sender_id !== user?.id) {
            await markAsRead(conversationId, [newMessage.id]);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Mesaj güncellendi
          const updatedMessage = payload.new as any;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Mesaj silindi
          const oldMessage = payload.old as any;
          setMessages((prev) => prev.filter((m) => m.id !== oldMessage.id));
        },
      )
      .subscribe();

    setSubscriptions((prev) => ({ ...prev, [conversationId]: channel }));

    return () => {
      if (subscriptions[conversationId]) {
        supabase.removeChannel(subscriptions[conversationId]);
        setSubscriptions((prev) => {
          const newSubs = { ...prev };
          delete newSubs[conversationId];
          return newSubs;
        });
      }
    };
  };

  const archiveConversation = async (conversationId: string) => {
    if (!user) return;
    // TODO: Implement
  };

  const muteConversation = async (conversationId: string, mute: boolean) => {
    if (!user) return;
    // TODO: Implement
  };

  const clearMessages = () => {
    setMessages([]);
    setMessagePage(1);
    setHasMore(true);
  };

  // İlk yükleme
  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user]);

  // Current conversation değiştiğinde eski subscription'ları temizle
  useEffect(() => {
    return () => {
      Object.values(subscriptions).forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, []);

  return (
    <MessageContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        loading,
        refreshing,
        hasMore,

        fetchConversations,
        createConversation,
        getConversation,
        archiveConversation,
        muteConversation,

        fetchMessages,
        sendMessage,
        editMessage,
        deleteForEveryone,
        deleteForMe,
        replyToMessage,

        addReaction,
        removeReaction,

        markAsRead,

        sharePost,

        subscribeToConversation,

        setCurrentConversation,
        clearMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};
