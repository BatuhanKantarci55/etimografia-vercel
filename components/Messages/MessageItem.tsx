import CustomText from "@components/CustomText";
import MessageReactions from "@components/Messages/MessageReactions";
import PostPreview from "@components/Messages/PostPreview";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";

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

// Basit ImageViewer component
const SimpleImageViewer = ({
  visible,
  imageUri,
  onClose,
}: {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.viewerOverlay}>
        <TouchableOpacity style={styles.viewerCloseButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUri }}
          style={styles.viewerImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

interface MessageItemProps {
  message: any;
  isOwnMessage: boolean;
  onReply: (message: any) => void;
  onReaction: (messageId: string, reaction: string) => void;
  onRemoveReaction: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => Promise<any>;
  onDeleteForEveryone?: (messageId: string) => Promise<any>;
  onDeleteForMe?: (messageId: string) => Promise<any>;
  onReplyMessagePress?: (messageId: string) => void;
  isHighlighted?: boolean;
}

export default function MessageItem({
  message,
  isOwnMessage,
  onReply,
  onReaction,
  onRemoveReaction,
  onEdit,
  onDeleteForEveryone,
  onDeleteForMe,
  onReplyMessagePress,
  isHighlighted,
}: MessageItemProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState(message.content || "");
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [longPressed, setLongPressed] = useState(false);

  // Kaydırma için animasyon
  const translateX = useRef(new Animated.Value(0)).current;
  // Highlight animasyonu
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isHighlighted) {
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isHighlighted]);

  const getAvatarSource = (avatarIndex: number) => {
    return allAvatars[avatarIndex % allAvatars.length];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLongPress = () => {
    setLongPressed(true);
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setLongPressed(false);
    setMenuVisible(false);
  };

  const handleReply = () => {
    onReply(message);
    handleCloseMenu();
  };

  const handleCopy = async () => {
    if (message.content) {
      await Clipboard.setStringAsync(message.content);
      Alert.alert("Başarılı", "Mesaj panoya kopyalandı.");
    }
    handleCloseMenu();
  };

  const handleEdit = () => {
    setEditModalVisible(true);
    handleCloseMenu();
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    if (onEdit) {
      await onEdit(message.id, editText.trim());
    }
    setEditModalVisible(false);
  };

  const handleDeleteForEveryone = () => {
    Alert.alert(
      "Mesajı Sil",
      "Bu mesajı herkesten silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            if (onDeleteForEveryone) {
              await onDeleteForEveryone(message.id);
            }
            handleCloseMenu();
          },
        },
      ],
    );
  };

  const handleDeleteForMe = () => {
    Alert.alert(
      "Mesajı Sil",
      "Bu mesajı sadece sizin için silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            if (onDeleteForMe) {
              await onDeleteForMe(message.id);
              setLongPressed(false);
            }
            handleCloseMenu();
          },
        },
      ],
    );
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true },
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const translationX = event.nativeEvent.translationX;

      if (translationX > 30) {
        onReply(message);
      }

      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
      }).start();
    }
  };

  const translateXInterpolation = translateX.interpolate({
    inputRange: [-50, 0, 50, 100],
    outputRange: [0, 0, 50, 50],
    extrapolate: "clamp",
  });

  const backgroundColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", colors.primary + "30"],
  });

  const handleReplyMessagePress = () => {
    if (message.reply_to && onReplyMessagePress) {
      onReplyMessagePress(message.reply_to.id);
    }
  };

  const renderReplyContent = () => {
    if (!message.reply_to) return null;

    const renderReplyPreview = () => {
      if (message.reply_to.type === "image") {
        return (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: message.reply_to.content }}
              style={{
                // DEĞİŞİKLİK: Masaüstü yanıt alınan resim önizlemesi daha da küçültüldü (18 -> 14)
                width: scale(isDesktop ? 14 : 40),
                height: scale(isDesktop ? 14 : 40),
                borderRadius: scale(isDesktop ? 2 : 6),
                marginRight: scale(isDesktop ? 4 : 8),
              }}
              resizeMode="cover"
            />
            <CustomText
              style={{
                // DEĞİŞİKLİK: Masaüstü yazı boyutu küçültüldü (9 -> 8)
                fontSize: scale(isDesktop ? 8 : 12),
                color: isOwnMessage ? "white" : colors.text,
                opacity: 0.8,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {message.reply_to.sender?.username} tarafından paylaşıldı
            </CustomText>
          </View>
        );
      } else if (message.reply_to.type === "post") {
        return (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                // DEĞİŞİKLİK: Masaüstü gönderi kutucuğu boyutu küçültüldü
                width: scale(isDesktop ? 14 : 40),
                height: scale(isDesktop ? 14 : 40),
                borderRadius: scale(isDesktop ? 2 : 6),
                marginRight: scale(isDesktop ? 4 : 8),
                backgroundColor: colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="repeat"
                size={scale(isDesktop ? 8 : 20)}
                color={colors.primary}
              />
            </View>
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 8 : 12),
                color: isOwnMessage ? "white" : colors.text,
                opacity: 0.8,
                flex: 1,
              }}
              numberOfLines={1}
            >
              Gönderi paylaştı
            </CustomText>
          </View>
        );
      } else {
        // Text mesajı
        return (
          <CustomText
            style={{
              // DEĞİŞİKLİK: Masaüstü yanıt metni boyutu küçültüldü (9 -> 8)
              fontSize: scale(isDesktop ? 8 : 12),
              color: isOwnMessage ? "white" : colors.text,
              opacity: 0.8,
            }}
            numberOfLines={1}
          >
            {message.reply_to.content}
          </CustomText>
        );
      }
    };

    return (
      <TouchableOpacity onPress={handleReplyMessagePress} activeOpacity={0.7}>
        <View
          style={[
            styles.replyContainer,
            {
              backgroundColor: isOwnMessage
                ? colors.secondary + "70"
                : colors.text + "20",
              borderLeftWidth: 3,
              borderLeftColor: isOwnMessage ? "white" : colors.primary,
              // DEĞİŞİKLİK: Yanıt baloncuğu kavis ve boşlukları daha da daraltıldı
              borderRadius: scale(isDesktop ? 3 : 6),
              padding: scale(isDesktop ? 2 : 6),
              marginBottom: scale(isDesktop ? 2 : 6),
            },
          ]}
        >
          <CustomText
            style={{
              // DEĞİŞİKLİK: Yanıt kullanıcı adı boyutu (8 -> 7)
              fontSize: scale(isDesktop ? 7 : 11),
              color: isOwnMessage ? "white" : colors.primary,
              fontWeight: "500",
              marginBottom: scale(2),
            }}
          >
            @{message.reply_to.sender?.username}
          </CustomText>

          {renderReplyPreview()}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    switch (message.type) {
      case "image":
        return (
          <TouchableOpacity
            onPress={() => setImageViewerVisible(true)}
            activeOpacity={0.8}
            style={{ width: "100%" }}
          >
            <Image
              source={{ uri: message.content }}
              style={[
                styles.imageMessage,
                {
                  width: "100%",
                  height: undefined,
                  aspectRatio: 1,
                  // DEĞİŞİKLİK: Görselin kavisleri de bir miktar küçültüldü
                  borderRadius: scale(isDesktop ? 4 : 8),
                },
              ]}
              resizeMode="cover"
            />
            {message.metadata?.caption && (
              <CustomText
                style={{
                  // DEĞİŞİKLİK: Görsel altı açıklama boyutu küçültüldü (9 -> 8)
                  fontSize: scale(isDesktop ? 8 : 12),
                  color: isOwnMessage ? "white" : colors.text + "80",
                  marginTop: scale(isDesktop ? 2 : 4),
                }}
              >
                {message.metadata.caption}
              </CustomText>
            )}
          </TouchableOpacity>
        );

      case "post":
        return <PostPreview post={message.metadata} />;

      case "sticker":
        return (
          <Image
            source={{ uri: message.content }}
            style={[
              styles.stickerMessage,
              {
                // DEĞİŞİKLİK: Masaüstünde sticker boyutu küçültüldü (60 -> 50)
                width: scale(isDesktop ? 50 : 120),
                height: scale(isDesktop ? 50 : 120),
              },
            ]}
            resizeMode="contain"
          />
        );

      default:
        return (
          <CustomText
            style={{
              // DEĞİŞİKLİK: Masaüstü ana mesaj metin boyutu daha da küçültüldü (11 -> 10)
              fontSize: scale(isDesktop ? 10 : 14),
              color: isOwnMessage ? "white" : colors.text,
              lineHeight: scale(isDesktop ? 12 : 20), // 14 -> 12
            }}
          >
            {message.content}
          </CustomText>
        );
    }
  };

  // İşlem (Düzenle/Sil) menüsü içeriği
  const renderActionMenuContent = () => (
    <TouchableOpacity
      style={[
        styles.modalOverlay,
        isDesktop && {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          elevation: 9999,
          borderRadius: 24,
        },
      ]}
      activeOpacity={1}
      onPress={handleCloseMenu}
    >
      <View
        style={[
          styles.menuContainer,
          {
            backgroundColor: colors.card,
            borderRadius: scale(12),
            padding: scale(isDesktop ? 2 : 8),
          },
          isDesktop && { width: scale(120), maxWidth: scale(140) }, // DEĞİŞİKLİK: Menü genişliği daha da daraltıldı
        ]}
      >
        {/* Cevapla */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              // DEĞİŞİKLİK: Menü öğesi padding'i küçültüldü (4 -> 3)
              padding: scale(isDesktop ? 3 : 16),
              borderRadius: scale(8),
            },
          ]}
          onPress={handleReply}
        >
          <Ionicons
            name="arrow-undo"
            size={scale(isDesktop ? 10 : 20)} // 14 -> 10
            color={colors.primary}
          />
          <CustomText
            style={[
              styles.menuText,
              {
                fontSize: scale(isDesktop ? 10 : 16), // 12 -> 10
                color: colors.text,
                marginLeft: scale(isDesktop ? 4 : 12), // 8 -> 4
              },
            ]}
          >
            Cevapla
          </CustomText>
        </TouchableOpacity>

        {/* Kopyala */}
        {message.type === "text" && message.content && (
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                padding: scale(isDesktop ? 3 : 16),
                borderRadius: scale(8),
              },
            ]}
            onPress={handleCopy}
          >
            <Ionicons
              name="copy-outline"
              size={scale(isDesktop ? 10 : 20)}
              color={colors.primary}
            />
            <CustomText
              style={[
                styles.menuText,
                {
                  fontSize: scale(isDesktop ? 10 : 16),
                  color: colors.text,
                  marginLeft: scale(isDesktop ? 4 : 12),
                },
              ]}
            >
              Kopyala
            </CustomText>
          </TouchableOpacity>
        )}

        {/* Düzenle */}
        {isOwnMessage && message.type === "text" && onEdit && (
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                padding: scale(isDesktop ? 3 : 16),
                borderRadius: scale(8),
              },
            ]}
            onPress={handleEdit}
          >
            <Ionicons
              name="pencil"
              size={scale(isDesktop ? 10 : 20)}
              color={colors.primary}
            />
            <CustomText
              style={[
                styles.menuText,
                {
                  fontSize: scale(isDesktop ? 10 : 16),
                  color: colors.text,
                  marginLeft: scale(isDesktop ? 4 : 12),
                },
              ]}
            >
              Düzenle
            </CustomText>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.menuDivider,
            {
              backgroundColor: colors.text + "20",
              height: 1,
              marginVertical: scale(isDesktop ? 4 : 8),
            },
          ]}
        />

        {/* Sadece Benden Sil */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              padding: scale(isDesktop ? 3 : 16),
              borderRadius: scale(8),
            },
          ]}
          onPress={handleDeleteForMe}
        >
          <Ionicons
            name="close-circle"
            size={scale(isDesktop ? 10 : 20)}
            color={colors.text + "60"}
          />
          <CustomText
            style={[
              styles.menuText,
              {
                fontSize: scale(isDesktop ? 10 : 16),
                color: colors.text + "60",
                marginLeft: scale(isDesktop ? 4 : 12),
              },
            ]}
          >
            Sadece Benden Sil
          </CustomText>
        </TouchableOpacity>

        {/* Herkesten Sil */}
        {isOwnMessage && onDeleteForEveryone && (
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                padding: scale(isDesktop ? 3 : 16),
                borderRadius: scale(8),
              },
            ]}
            onPress={handleDeleteForEveryone}
          >
            <Ionicons
              name="trash"
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
              Herkesten Sil
            </CustomText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Yorum Düzenleme menüsü içeriği
  const renderEditModalContent = () => (
    <View
      style={[
        styles.editModalOverlay,
        isDesktop && {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          elevation: 9999,
          borderRadius: 24,
        },
      ]}
    >
      <View
        style={[
          styles.editModalContainer,
          {
            backgroundColor: colors.card,
            borderRadius: scale(16),
            padding: scale(isDesktop ? 6 : 20),
          },
          isDesktop && { width: scale(180) }, // 200 -> 180
        ]}
      >
        <CustomText
          style={{
            fontSize: scale(isDesktop ? 10 : 18), // 11 -> 10
            color: colors.text,
            fontWeight: "600",
            marginBottom: scale(isDesktop ? 4 : 16),
          }}
        >
          Mesajı Düzenle
        </CustomText>

        <TextInput
          style={[
            styles.editInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: scale(isDesktop ? 9 : 14), // 10 -> 9
              padding: scale(isDesktop ? 4 : 12),
              borderRadius: scale(8),
              marginBottom: scale(isDesktop ? 4 : 16),
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
                fontSize: scale(isDesktop ? 9 : 16), // 10 -> 9
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
                fontSize: scale(isDesktop ? 9 : 16),
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
  );

  return (
    <Animated.View style={{ backgroundColor }}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={10}
      >
        <Animated.View
          style={[
            {
              transform: [{ translateX: translateXInterpolation }],
            },
          ]}
        >
          <TouchableWithoutFeedback
            onLongPress={handleLongPress}
            onPress={() => setLongPressed(false)}
            delayLongPress={300}
          >
            <View
              style={[
                styles.container,
                isOwnMessage ? styles.ownMessage : styles.otherMessage,
                { marginBottom: scale(isDesktop ? 2 : 4) },
              ]}
            >
              {/* Avatar (sadece diğer kişinin mesajlarında) */}
              {!isOwnMessage && (
                <View
                  style={[
                    styles.avatar,
                    {
                      // DEĞİŞİKLİK: Masaüstü için sohbet penceresi gönderen kişi avatarı daha da küçültüldü (18 -> 14)
                      width: scale(isDesktop ? 14 : 28),
                      height: scale(isDesktop ? 14 : 28),
                      borderRadius: scale(isDesktop ? 7 : 14),
                      marginRight: scale(isDesktop ? 4 : 6),
                      alignSelf: "flex-start",
                      marginTop: scale(isDesktop ? 0 : 2),
                    },
                  ]}
                >
                  <Image
                    source={getAvatarSource(message.sender?.avatar_index || 0)}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              <View style={{ flex: 1 }}>
                {/* Mesaj içeriği */}
                <View
                  style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownBubble : styles.otherBubble,
                    {
                      backgroundColor: isOwnMessage
                        ? colors.primary
                        : colors.card,
                      // DEĞİŞİKLİK: Masaüstü mesaj balonu kavisleri ve iç boşluğu daha da daraltıldı (6 -> 4, 4 -> 3)
                      borderRadius: scale(isDesktop ? 4 : 12),
                      padding: scale(isDesktop ? 3 : 8),
                    },
                  ]}
                >
                  {/* Cevap verilen mesaj - tıklanabilir */}
                  {renderReplyContent()}

                  {renderContent()}

                  {/* Düzenlendi bilgisi */}
                  {message.is_edited && (
                    <CustomText
                      style={{
                        // DEĞİŞİKLİK: Düzenlendi yazısı küçültüldü (7 -> 6)
                        fontSize: scale(isDesktop ? 6 : 10),
                        color: isOwnMessage ? "white" : colors.text + "60",
                        marginTop: scale(isDesktop ? 1 : 4),
                        fontStyle: "italic",
                      }}
                    >
                      düzenlendi
                    </CustomText>
                  )}

                  {/* Zaman bilgisi */}
                  <CustomText
                    style={[
                      styles.timeText,
                      {
                        // DEĞİŞİKLİK: Zaman fontu küçültüldü (7 -> 6)
                        fontSize: scale(isDesktop ? 6 : 10),
                        color: isOwnMessage ? "white" : colors.text + "60",
                        marginTop: scale(isDesktop ? 1 : 4),
                      },
                    ]}
                  >
                    {formatTime(message.created_at)}
                  </CustomText>
                </View>

                {/* Tepkiler */}
                {message.reactions && message.reactions.length > 0 && (
                  <MessageReactions
                    reactions={message.reactions}
                    messageId={message.id}
                    currentUserId={user?.id || ""}
                    onReaction={onReaction}
                    onRemoveReaction={onRemoveReaction}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </PanGestureHandler>

      {/* İşlem Menüsü */}
      <Modal
        visible={menuVisible && !isDesktop}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        {renderActionMenuContent()}
      </Modal>

      {/* Düzenleme Modalı */}
      <Modal
        visible={editModalVisible && !isDesktop}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        {renderEditModalContent()}
      </Modal>

      {/* Masaüstünde Modal kullanmadan en üst katmanda Z-Index sorunu olmadan renderla */}
      {isDesktop && menuVisible && renderActionMenuContent()}
      {isDesktop && editModalVisible && renderEditModalContent()}

      {/* Görsel görüntüleyici - SimpleImageViewer kullan */}
      {message.type === "image" && message.content && (
        <SimpleImageViewer
          imageUri={message.content}
          visible={imageViewerVisible}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  ownMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  avatar: {
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  messageBubble: {
    maxWidth: "80%",
  },
  ownBubble: {
    alignSelf: "flex-end",
  },
  otherBubble: {
    alignSelf: "flex-start",
  },
  timeText: {
    alignSelf: "flex-end",
  },
  replyContainer: {},
  imageMessage: {},
  stickerMessage: {},
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
  menuDivider: {
    marginVertical: 8,
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
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
  viewerCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
});
