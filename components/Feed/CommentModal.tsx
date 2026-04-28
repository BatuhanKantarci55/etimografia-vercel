import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { Comment, useComments } from "@contexts/CommentContext";
import { usePosts } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postUserId: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export default function CommentModal({
  visible,
  onClose,
  postId,
  postUserId,
  onCommentAdded,
  onCommentDeleted,
}: CommentModalProps) {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const {
    comments,
    loading,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    toggleReplies,
  } = useComments();
  const { refreshPosts } = usePosts();

  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState<{
    userId: string;
    username: string;
    commentId: string;
  } | null>(null);
  const [replyingToParentId, setReplyingToParentId] = useState<string | null>(
    null,
  );

  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        setTimeout(() => {
          if (comments.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }, 100);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [comments.length]);

  useEffect(() => {
    if (visible && postId) {
      fetchComments(postId);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    } else {
      setCommentText("");
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      setSelectedComment(null);
      setReplyTo(null);
      setReplyingToParentId(null);
    }
  }, [visible, postId]);

  const handleSendComment = async () => {
    if (!commentText.trim() || sending) return;

    setSending(true);

    let error;
    if (replyTo) {
      const parentId = replyingToParentId || replyTo.commentId;
      ({ error } = await addComment(
        postId,
        commentText,
        parentId,
        replyTo.userId,
        replyTo.username,
      ));
    } else {
      ({ error } = await addComment(postId, commentText));
    }

    setSending(false);

    if (error) {
      Alert.alert("Hata", error.message || "Yorum gönderilemedi");
    } else {
      setCommentText("");
      setReplyTo(null);
      setReplyingToParentId(null);
      await refreshPosts();
      if (onCommentAdded) {
        onCommentAdded();
      }
      setTimeout(() => {
        if (comments.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 200);
    }
  };

  const handleSubmitEditing = () => {
    handleSendComment();
  };

  const handleLikeComment = async (comment: Comment) => {
    if (comment.user_liked) {
      await unlikeComment(comment.id);
    } else {
      await likeComment(comment.id);
    }
  };

  const handleLongPressComment = (comment: Comment) => {
    if (comment.user_id === user?.id) {
      setSelectedComment(comment);
      setActionMenuVisible(true);
    }
  };

  const handleEditPress = () => {
    setActionMenuVisible(false);
    if (selectedComment) {
      setEditText(selectedComment.content);
      setEditModalVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedComment || !editText.trim()) return;

    const { error } = await updateComment(selectedComment.id, editText);

    if (error) {
      Alert.alert("Hata", "Yorum düzenlenirken bir hata oluştu");
    } else {
      await refreshPosts();
      if (onCommentAdded) {
        onCommentAdded();
      }
    }

    setEditModalVisible(false);
    setSelectedComment(null);
    setEditText("");
  };

  const handleDeletePress = () => {
    setActionMenuVisible(false);
    Alert.alert("Yorumu Sil", "Bu yorumu silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          if (selectedComment) {
            const { error } = await deleteComment(selectedComment.id);
            if (error) {
              Alert.alert("Hata", "Yorum silinirken bir hata oluştu");
            } else {
              await refreshPosts();
              if (onCommentAdded) {
                onCommentAdded();
              }
              if (onCommentDeleted) {
                onCommentDeleted();
              }
            }
            setSelectedComment(null);
          }
        },
      },
    ]);
  };

  const handleReplyPress = (comment: Comment) => {
    const findParentCommentId = (c: Comment): string => {
      if (c.parent_id) {
        return c.id;
      }
      return c.id;
    };

    const parentId = findParentCommentId(comment);
    setReplyingToParentId(parentId);
    setReplyTo({
      userId: comment.user_id,
      username: comment.user.username,
      commentId: comment.id,
    });
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
    setReplyingToParentId(null);
  };

  const getAvatarSource = (avatarIndex: number) => {
    return allAvatars[avatarIndex % allAvatars.length];
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
              // DEĞİŞİKLİK: Masaüstünde yorum metni boyutu daha da küçültüldü (11 -> 10)
              fontSize: scale(isDesktop ? 10 : 14),
              color: colors.primary,
            }}
          >
            {mention}{" "}
          </CustomText>
          <CustomText
            fontFamily="regular"
            style={{
              fontSize: scale(isDesktop ? 10 : 14),
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
          // DEĞİŞİKLİK: Masaüstünde yorum metni boyutu daha da küçültüldü (11 -> 10)
          fontSize: scale(isDesktop ? 10 : 14),
          color: colors.text,
        }}
      >
        {content}
      </CustomText>
    );
  };

  const renderMainComment = ({ item }: { item: Comment }) => {
    const totalReplies = item.replies_count || 0;

    return (
      <View>
        {/* Ana yorum */}
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => handleLongPressComment(item)}
          delayLongPress={300}
          style={{ width: "100%" }}
        >
          <View
            style={[
              styles.commentContainer,
              { marginBottom: scale(isDesktop ? 4 : 8) },
            ]}
          >
            {/* Avatar */}
            <Image
              source={getAvatarSource(item.user.avatar_index)}
              style={[
                styles.avatarImage,
                {
                  // DEĞİŞİKLİK: Masaüstünde yorum avatarı boyutu küçültüldü (24 -> 20)
                  width: scale(isDesktop ? 20 : 40),
                  height: scale(isDesktop ? 20 : 40),
                  borderRadius: scale(isDesktop ? 10 : 20),
                  marginRight: scale(isDesktop ? 6 : 12),
                  marginLeft: 0,
                },
              ]}
              resizeMode="cover"
            />

            {/* Yorum içeriği */}
            <View style={[styles.commentContent, { flex: 1 }]}>
              <View style={styles.commentHeader}>
                <CustomText
                  style={{
                    // DEĞİŞİKLİK: Masaüstünde kullanıcı adı boyutu küçültüldü (11 -> 10)
                    fontSize: scale(isDesktop ? 10 : 14),
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {item.user.username}
                </CustomText>
                <CustomText
                  style={{
                    // DEĞİŞİKLİK: Masaüstünde zaman bilgisi küçültüldü (8 -> 7)
                    fontSize: scale(isDesktop ? 7 : 11),
                    color: colors.text + "60",
                    marginLeft: scale(8),
                  }}
                >
                  {formatTime(item.created_at)}
                </CustomText>
              </View>

              {/* Yorum metni */}
              {renderCommentContent(item.content)}

              {/* Yanıtla butonu */}
              <TouchableOpacity onPress={() => handleReplyPress(item)}>
                <CustomText
                  style={{
                    // DEĞİŞİKLİK: Masaüstünde Yanıtla butonu küçültüldü (9 -> 8)
                    fontSize: scale(isDesktop ? 8 : 12),
                    color: colors.primary,
                    marginTop: scale(isDesktop ? 1 : 4),
                    fontWeight: "500",
                  }}
                >
                  Yanıtla
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* Kalp ve beğeni sayısı */}
            <View style={styles.likeContainer}>
              <TouchableOpacity
                onPress={() => handleLikeComment(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={item.user_liked ? "heart" : "heart-outline"}
                  // DEĞİŞİKLİK: Masaüstünde kalp ikonu küçültüldü (12 -> 10)
                  size={scale(isDesktop ? 10 : 18)}
                  color={item.user_liked ? "#FF3B30" : colors.text + "60"}
                />
              </TouchableOpacity>
              {item.likes_count > 0 && (
                <CustomText
                  style={{
                    // DEĞİŞİKLİK: Masaüstünde beğeni sayısı küçültüldü (8 -> 7)
                    fontSize: scale(isDesktop ? 7 : 11),
                    color: colors.text + "60",
                    marginTop: scale(2),
                    textAlign: "center",
                  }}
                >
                  {item.likes_count}
                </CustomText>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Yanıtlar bölümü */}
        {totalReplies > 0 && (
          <View style={{ marginLeft: scale(isDesktop ? 20 : 32) }}>
            <TouchableOpacity
              onPress={() => toggleReplies(item.id)}
              style={styles.showRepliesButton}
            >
              <Ionicons
                name={item.show_replies ? "chevron-up" : "chevron-down"}
                // DEĞİŞİKLİK: Masaüstünde ok ikonu küçültüldü (10 -> 8)
                size={scale(isDesktop ? 8 : 16)}
                color={colors.primary}
              />
              <CustomText
                style={{
                  // DEĞİŞİKLİK: Masaüstünde yanıtları göster yazısı küçültüldü (9 -> 8)
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
              <View style={{ marginTop: scale(8) }}>
                {item.replies.map((reply) => (
                  <View key={reply.id}>{renderReply(reply, item.id)}</View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Yanıtları render et
  const renderReply = (reply: Comment, mainCommentId: string) => {
    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => handleLongPressComment(reply)}
          delayLongPress={300}
          style={{ width: "100%" }}
        >
          <View
            style={[
              styles.commentContainer,
              { marginBottom: scale(isDesktop ? 4 : 12) },
            ]}
          >
            {/* Avatar - yanıtlarda daha küçük */}
            <Image
              source={getAvatarSource(reply.user.avatar_index)}
              style={[
                styles.avatarImage,
                {
                  // DEĞİŞİKLİK: Masaüstünde yanıt avatarı küçültüldü (20 -> 16)
                  width: scale(isDesktop ? 16 : 36),
                  height: scale(isDesktop ? 16 : 36),
                  borderRadius: scale(isDesktop ? 8 : 18),
                  marginRight: scale(isDesktop ? 6 : 12),
                  marginLeft: 0,
                },
              ]}
              resizeMode="cover"
            />

            {/* Yorum içeriği */}
            <View style={[styles.commentContent, { flex: 1 }]}>
              <View style={styles.commentHeader}>
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 10 : 14), // 11 -> 10
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {reply.user.username}
                </CustomText>
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 7 : 11), // 8 -> 7
                    color: colors.text + "60",
                    marginLeft: scale(8),
                  }}
                >
                  {formatTime(reply.created_at)}
                </CustomText>
              </View>

              {/* Yorum metni */}
              {renderCommentContent(reply.content)}

              {/* Yanıtla butonu */}
              <TouchableOpacity onPress={() => handleReplyPress(reply)}>
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 8 : 12), // 9 -> 8
                    color: colors.primary,
                    marginTop: scale(isDesktop ? 1 : 4),
                    fontWeight: "500",
                  }}
                >
                  Yanıtla
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* Kalp ve beğeni sayısı */}
            <View style={styles.likeContainer}>
              <TouchableOpacity
                onPress={() => handleLikeComment(reply)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={reply.user_liked ? "heart" : "heart-outline"}
                  size={scale(isDesktop ? 10 : 16)} // 12 -> 10
                  color={reply.user_liked ? "#FF3B30" : colors.text + "60"}
                />
              </TouchableOpacity>
              {reply.likes_count > 0 && (
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 7 : 10), // 8 -> 7
                    color: colors.text + "60",
                    marginTop: scale(2),
                    textAlign: "center",
                  }}
                >
                  {reply.likes_count}
                </CustomText>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* İç içe yanıtlar */}
        {reply.replies && reply.replies.length > 0 && (
          <View style={{ marginTop: scale(4) }}>
            {reply.replies.map((nestedReply) => (
              <View key={nestedReply.id}>
                {renderReply(nestedReply, mainCommentId)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const inputContainerStyle = [
    styles.inputContainer,
    {
      backgroundColor: colors.background,
      borderTopColor: colors.text + "10",
      bottom: isKeyboardVisible ? keyboardHeight : 0,
      paddingHorizontal: 0,
      // DEĞİŞİKLİK: Masaüstünde girdi kutusunun dikey boşlukları daha da daraltıldı (6 -> 4)
      paddingVertical: scale(isDesktop ? 4 : 12),
    },
  ];

  // DEĞİŞİKLİK: İşlem (Düzenle/Sil) menüsü.
  // Z-index çakışmasını aşmak için hem masaüstü hem de mobil için her zaman Modal kullanıyoruz.
  const renderActionMenu = () => {
    return (
      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionMenuVisible(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.card,
                borderRadius: scale(12),
                // DEĞİŞİKLİK: Masaüstü için padding küçültüldü (4 -> 2)
                padding: scale(isDesktop ? 2 : 8),
              },
              // DEĞİŞİKLİK: Masaüstü menü genişliği daha da daraltıldı (120 -> 100)
              isDesktop && { width: scale(100), maxWidth: scale(120) },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  // DEĞİŞİKLİK: Masaüstü buton padding daraltıldı (6 -> 4)
                  padding: scale(isDesktop ? 4 : 16),
                  borderRadius: scale(8),
                },
              ]}
              onPress={handleEditPress}
            >
              <Ionicons
                name="pencil-outline"
                // DEĞİŞİKLİK: İkon boyutu küçültüldü (12 -> 10)
                size={scale(isDesktop ? 10 : 20)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.menuText,
                  {
                    // DEĞİŞİKLİK: Metin boyutu küçültüldü (11 -> 10)
                    fontSize: scale(isDesktop ? 10 : 16),
                    color: colors.text,
                    marginLeft: scale(isDesktop ? 4 : 12),
                  },
                ]}
              >
                Düzenle
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  padding: scale(isDesktop ? 4 : 16),
                  borderRadius: scale(8),
                },
              ]}
              onPress={handleDeletePress}
            >
              <Ionicons
                name="trash-outline"
                size={scale(isDesktop ? 10 : 20)}
                color="#FF3B30"
              />
              <CustomText
                style={[
                  styles.menuText,
                  {
                    fontSize: scale(isDesktop ? 10 : 16),
                    color: "#FF3B30",
                    marginLeft: scale(isDesktop ? 4 : 12),
                  },
                ]}
              >
                Sil
              </CustomText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // DEĞİŞİKLİK: Yorum Düzenleme menüsü.
  // Z-index çakışmasını aşmak için hem masaüstü hem de mobil için Modal kullanıyoruz.
  const renderEditModal = () => {
    return (
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalOverlay}>
          <View
            style={[
              styles.editModalContainer,
              {
                backgroundColor: colors.card,
                borderRadius: scale(16),
                // DEĞİŞİKLİK: Düzenleme modalı padding'i (10 -> 8)
                padding: scale(isDesktop ? 8 : 20),
              },
              // DEĞİŞİKLİK: Düzenleme modalı genişliği (240 -> 200)
              isDesktop && { width: scale(200) },
            ]}
          >
            <CustomText
              style={{
                // DEĞİŞİKLİK: Başlık boyutu (12 -> 11)
                fontSize: scale(isDesktop ? 11 : 18),
                color: colors.text,
                fontWeight: "600",
                marginBottom: scale(isDesktop ? 4 : 16),
              }}
            >
              Yorumu Düzenle
            </CustomText>

            <TextInput
              style={[
                styles.editInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  // DEĞİŞİKLİK: Girdi boyutu ve padding
                  fontSize: scale(isDesktop ? 10 : 14), // 11 -> 10
                  padding: scale(isDesktop ? 4 : 12), // 6 -> 4
                  borderRadius: scale(8),
                  marginBottom: scale(isDesktop ? 4 : 16), // 6 -> 4
                  borderWidth: 1,
                  borderColor: colors.text + "20",
                },
              ]}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
            />

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[
                  styles.editModalButton,
                  {
                    backgroundColor: colors.text + "10",
                    // DEĞİŞİKLİK: Buton padding (6 -> 4)
                    padding: scale(isDesktop ? 4 : 12),
                    borderRadius: scale(8),
                    flex: 1,
                    marginRight: scale(isDesktop ? 4 : 8),
                  },
                ]}
                onPress={() => setEditModalVisible(false)}
              >
                <CustomText
                  style={{
                    // DEĞİŞİKLİK: Buton metni boyutu (11 -> 10)
                    fontSize: scale(isDesktop ? 10 : 16),
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  İptal
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.editModalButton,
                  {
                    backgroundColor: colors.primary,
                    padding: scale(isDesktop ? 4 : 12),
                    borderRadius: scale(8),
                    flex: 1,
                    marginLeft: scale(isDesktop ? 4 : 8),
                  },
                ]}
                onPress={handleSaveEdit}
              >
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 10 : 16),
                    color: "white",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Kaydet
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        title="Yorumlar"
        height="80%" // Mobil yükseklik
        desktopWidth={scale(280)} // DEĞİŞİKLİK: Masaüstü için yorum penceresi genişliği biraz daha daraltıldı (320 -> 280)
        showCloseButton={true}
        showDragHandle={true}
        closeOnBackdropPress={true}
        closeOnSwipeDown={true}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={[styles.container, { flex: 1 }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderMainComment}
                contentContainerStyle={[
                  styles.commentsList,
                  {
                    paddingBottom: isKeyboardVisible ? keyboardHeight + 80 : 80,
                    paddingHorizontal: 0,
                  },
                ]}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  if (comments.length > 0 && sending) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="chatbubble-outline"
                      // DEĞİŞİKLİK: Masaüstü boş durum ikonu (28 -> 20)
                      size={scale(isDesktop ? 20 : 48)}
                      color={colors.text + "40"}
                    />
                    <CustomText
                      style={{
                        // DEĞİŞİKLİK: Masaüstü boş durum yazısı (11 -> 10)
                        fontSize: scale(isDesktop ? 10 : 16),
                        color: colors.text + "60",
                        marginTop: scale(12),
                        textAlign: "center",
                      }}
                    >
                      Henüz yorum yapılmamış.
                    </CustomText>
                    <CustomText
                      style={{
                        // DEĞİŞİKLİK: Masaüstü boş durum alt yazısı (9 -> 8)
                        fontSize: scale(isDesktop ? 8 : 14),
                        color: colors.text + "40",
                        marginTop: scale(4),
                        textAlign: "center",
                      }}
                    >
                      İlk yorumu sen yap!
                    </CustomText>
                  </View>
                }
              />
            )}

            <View style={inputContainerStyle}>
              <View style={[styles.inputWrapper]}>
                <Image
                  source={getAvatarSource(profile?.avatar_index || 0)}
                  style={[
                    styles.inputAvatar,
                    {
                      // DEĞİŞİKLİK: Masaüstü yazı girdi avatarı boyutu (20 -> 18)
                      width: scale(isDesktop ? 18 : 32),
                      height: scale(isDesktop ? 18 : 32),
                      borderRadius: scale(isDesktop ? 9 : 16),
                      marginRight: scale(8),
                    },
                  ]}
                  resizeMode="cover"
                />

                <View
                  style={[
                    styles.inputField,
                    { backgroundColor: colors.card, flex: 1 },
                  ]}
                >
                  {replyTo && (
                    <TouchableOpacity
                      onPress={cancelReply}
                      style={styles.replyIndicator}
                    >
                      <CustomText
                        style={{ fontSize: scale(10), color: colors.primary }} // 12 -> 10
                      >
                        @{replyTo.username} yanıtla
                      </CustomText>
                      <Ionicons
                        name="close"
                        size={scale(12)} // 16 -> 12
                        color={colors.text + "60"}
                      />
                    </TouchableOpacity>
                  )}
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        // DEĞİŞİKLİK: Masaüstü için girdi metni boyutu (11 -> 10)
                        fontSize: scale(isDesktop ? 10 : 14),
                        fontFamily: "Nunito-Regular",
                        paddingVertical: scale(isDesktop ? 4 : 8), // 6 -> 4
                      },
                    ]}
                    placeholder={replyTo ? "Yanıtını yaz..." : "Yorum ekle..."}
                    placeholderTextColor={colors.text + "60"}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline={false}
                    maxLength={500}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmitEditing}
                  />
                </View>

                <TouchableOpacity
                  style={styles.stickerButton}
                  onPress={() =>
                    Alert.alert(
                      "Sticker",
                      "Sticker özelliği yakında eklenecek!",
                    )
                  }
                >
                  <Ionicons
                    name="grid-outline"
                    // DEĞİŞİKLİK: Masaüstü sticker ikonu (14 -> 12)
                    size={scale(isDesktop ? 12 : 24)}
                    color={colors.text + "60"}
                  />
                </TouchableOpacity>

                {commentText.trim() ? (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendComment}
                    disabled={sending}
                  >
                    <CustomText
                      style={{
                        // DEĞİŞİKLİK: Masaüstü gönder butonu (11 -> 10)
                        fontSize: scale(isDesktop ? 10 : 14),
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Paylaş
                    </CustomText>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetModal>

      {/* DEĞİŞİKLİK: Modal çakışmalarını önlemek için her zaman Modal içerisinde ve BottomSheet'in dışında çağırılır */}
      {renderActionMenu()}
      {renderEditModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  commentsList: {
    paddingTop: 16,
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarImage: {},
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    minWidth: 30,
    alignSelf: "center", // Dikey ortalama için
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  inputContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputAvatar: {},
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  stickerButton: {
    padding: 8,
    marginLeft: 4,
  },
  sendButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  showRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: "80%",
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontWeight: "500",
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  editModalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  editInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  editModalButtons: {
    flexDirection: "row",
  },
  editModalButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
