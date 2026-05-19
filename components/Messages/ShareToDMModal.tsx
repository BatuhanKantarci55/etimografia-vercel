import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import PostPreview from "@components/Messages/PostPreview";
import { useAuth } from "@contexts/AuthContext";
import { useMessages } from "@contexts/MessageContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { getAvatarSource } from "@utils/avatarUtils";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ShareToDMModalProps {
  visible: boolean;
  onClose: () => void;
  post: any;
}

export default function ShareToDMModal({
  visible,
  onClose,
  post,
}: ShareToDMModalProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { conversations, fetchConversations, sharePost } = useMessages();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      console.log("ShareToDMModal açıldı, sohbetler getiriliyor...");
      fetchConversations().catch((err) => {
        console.error("Sohbetler getirilirken hata:", err);
        Alert.alert("Hata", "Sohbetler yüklenirken bir hata oluştu.");
      });
    }
  }, [visible]);

  useEffect(() => {
    try {
      if (searchQuery.trim()) {
        const filtered = conversations.filter((conv) =>
          conv.other_user?.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
        );
        setFilteredConversations(filtered);
      } else {
        setFilteredConversations(conversations);
      }
    } catch (error) {
      console.error("Sohbet filtreleme hatası:", error);
    }
  }, [searchQuery, conversations]);

  const handleSelectConversation = async (conversation: any) => {
    if (!user) {
      Alert.alert("Hata", "Kullanıcı bulunamadı.");
      return;
    }

    setLoading(true);
    setSelectedUserId(conversation.other_user?.id);

    console.log("Gönderi paylaşılıyor:", {
      postId: post.id,
      conversationId: conversation.id,
      username: conversation.other_user?.username,
    });

    try {
      const { error } = await sharePost(post.id, conversation.id);

      if (error) {
        console.error("Gönderi paylaşma hatası:", error);
        Alert.alert("Hata", "Gönderi paylaşılamadı: " + error.message);
        setLoading(false);
        setSelectedUserId(null);
        return;
      }

      console.log("Gönderi başarıyla paylaşıldı");

      // Başarı mesajı göster
      Alert.alert(
        "✅ Gönderi Paylaşıldı",
        `${conversation.other_user?.username || "Kullanıcı"} ile paylaşıldı.`,
        [{ text: "Tamam" }],
      );

      setLoading(false);
      setSelectedUserId(null);
      onClose(); // Modal'ı kapat
    } catch (error: any) {
      console.error("Beklenmeyen hata:", error);
      Alert.alert(
        "Hata",
        "Bir hata oluştu: " + (error.message || "Bilinmeyen hata"),
      );
      setLoading(false);
      setSelectedUserId(null);
    }
  };

  // getAvatarSource artık avatarUtils'den geliyor, bu fonksiyona gerek yok
  // const getAvatarSource = (avatarIndex: number) => {
  //   try {
  //     return allAvatars[avatarIndex % allAvatars.length];
  //   } catch (error) {
  //     return allAvatars[0];
  //   }
  // };

  const renderConversationItem = ({ item }: { item: any }) => {
    const isSelected = selectedUserId === item.other_user?.id;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: isSelected ? colors.primary + "20" : colors.card,
            marginBottom: scale(isDesktop ? 4 : 8),
            borderRadius: scale(12),
            padding: scale(isDesktop ? 6 : 12),
            borderWidth: isSelected ? 1 : 0,
            borderColor: colors.primary,
          },
        ]}
        onPress={() => handleSelectConversation(item)}
        activeOpacity={0.7}
        disabled={loading}
      >
        <View style={styles.conversationContent}>
          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              {
                width: scale(isDesktop ? 28 : 50),
                height: scale(isDesktop ? 28 : 50),
                borderRadius: scale(isDesktop ? 14 : 25),
                marginRight: scale(isDesktop ? 8 : 12),
              },
            ]}
          >
            <Image
              source={getAvatarSource(item.other_user?.avatar_index || 0)}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>

          {/* Bilgiler */}
          <View style={styles.conversationInfo}>
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 13 : 16),
                fontWeight: "600",
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {item.other_user?.username || "Kullanıcı"}
            </CustomText>
            {item.last_message && (
              <CustomText
                style={{
                  fontSize: scale(isDesktop ? 10 : 13),
                  color: colors.text + "80",
                  marginTop: scale(2),
                }}
                numberOfLines={1}
              >
                {item.last_message}
              </CustomText>
            )}
          </View>

          {/* Yükleniyor göstergesi */}
          {loading && isSelected && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginLeft: scale(8) }}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!post) {
    console.error("ShareToDMModal: post prop'u eksik");
    return null;
  }

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Gönderiyi Paylaş"
      height="80%"
      desktopWidth={scale(280)}
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <View style={[styles.container, { padding: scale(isDesktop ? 10 : 16) }]}>
        {/* Arama */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.card,
              borderRadius: scale(12),
              marginBottom: scale(isDesktop ? 8 : 16),
              paddingHorizontal: scale(isDesktop ? 8 : 12),
            },
          ]}
        >
          <Ionicons
            name="search"
            size={scale(isDesktop ? 14 : 20)}
            color={colors.text + "60"}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.text,
                fontSize: scale(isDesktop ? 12 : 14),
                paddingVertical: scale(isDesktop ? 6 : 12),
                marginLeft: scale(8),
              },
            ]}
            placeholder="Kullanıcı ara..."
            placeholderTextColor={colors.text + "60"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Gönderi Önizleme */}
        <View
          style={[
            styles.postPreviewContainer,
            { marginBottom: scale(isDesktop ? 8 : 16) },
          ]}
        >
          <PostPreview
            post={{
              post_id: post.id,
              post_type: post.post_type,
              content: post.content,
              image_url: post.image_url,
              username: post.username,
            }}
          />
        </View>

        {/* Sohbet Listesi */}
        {loading && !selectedUserId ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={scale(isDesktop ? 24 : 48)}
                  color={colors.text + "40"}
                />
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 12 : 16),
                    color: colors.text + "60",
                    marginTop: scale(isDesktop ? 8 : 12),
                    textAlign: "center",
                  }}
                >
                  {searchQuery
                    ? "Kullanıcı bulunamadı."
                    : "Henüz hiç sohbetiniz yok."}
                </CustomText>
              </View>
            }
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
  },
  postPreviewContainer: {
    // marginBottom inline style ile verilecek
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  conversationItem: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  conversationInfo: {
    flex: 1,
  },
});
