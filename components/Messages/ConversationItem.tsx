import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

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

interface ConversationItemProps {
  conversation: any;
  onPress: () => void;
  isSelected?: boolean;
}

export default function ConversationItem({
  conversation,
  onPress,
  isSelected = false,
}: ConversationItemProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const otherUser = conversation.other_user;

  // Son mesajı kontrol et
  let lastMessageDisplay = "Henüz mesaj yok";
  const lastMessage = conversation.last_message;
  const lastMessageSenderId = conversation.last_message_sender_id;
  const lastMessageType = conversation.last_message_type;

  if (lastMessageSenderId) {
    if (lastMessageType === "post") {
      lastMessageDisplay = "Gönderi";
    } else if (lastMessageType === "image") {
      lastMessageDisplay = "Fotoğraf";
    } else if (lastMessageType === "sticker") {
      lastMessageDisplay = "Sticker";
    } else if (lastMessage) {
      lastMessageDisplay = lastMessage;
    }
  }

  const lastMessageAt = conversation.last_message_at;
  const unreadCount = conversation.unread_count || 0;

  const getAvatarSource = (avatarIndex: number) => {
    return allAvatars[avatarIndex % allAvatars.length];
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (error) {
      return "";
    }
  };

  // Medya mesajı mı kontrol et
  const isMediaMessage = ["post", "image", "sticker"].includes(lastMessageType);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? colors.primary + "15" : colors.card,
          // DEĞİŞİKLİK: Masaüstünde aralıklar ve iç boşluklar daha da daraltıldı
          marginBottom: scale(isDesktop ? 2 : 8),
          borderRadius: scale(isDesktop ? 6 : 12),
          padding: scale(isDesktop ? 6 : 12),
          borderWidth: isSelected ? 1 : 0,
          borderColor: isSelected ? colors.primary + "80" : "transparent",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              // DEĞİŞİKLİK: Masaüstünde profil avatarı boyutu daha da daraltıldı (40 -> 32)
              width: scale(isDesktop ? 32 : 56),
              height: scale(isDesktop ? 32 : 56),
              borderRadius: scale(isDesktop ? 16 : 28),
              marginRight: scale(isDesktop ? 8 : 12),
            },
          ]}
        >
          <Image
            source={getAvatarSource(otherUser?.avatar_index || 0)}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>

        {/* Bilgiler */}
        <View style={styles.info}>
          <View style={styles.header}>
            <CustomText
              style={{
                // DEĞİŞİKLİK: Masaüstünde kullanıcı adı boyutu daha da daraltıldı (14 -> 12)
                fontSize: scale(isDesktop ? 12 : 16),
                fontWeight: "600",
                color: colors.text,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {otherUser?.username || "Kullanıcı"}
            </CustomText>
            {lastMessageAt && (
              <CustomText
                style={{
                  // DEĞİŞİKLİK: Masaüstünde zaman boyutu daha da daraltıldı (10 -> 9)
                  fontSize: scale(isDesktop ? 9 : 12),
                  color: colors.text + "60",
                  marginLeft: scale(4),
                }}
              >
                {formatTime(lastMessageAt)}
              </CustomText>
            )}
          </View>

          <View style={styles.footer}>
            <CustomText
              style={{
                // DEĞİŞİKLİK: Masaüstünde son mesaj boyutu daha da daraltıldı (12 -> 11)
                fontSize: scale(isDesktop ? 11 : 13),
                color: colors.text + "80",
                flex: 1,
                fontStyle: isMediaMessage ? "italic" : "normal",
              }}
              numberOfLines={1}
            >
              {lastMessageDisplay}
            </CustomText>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.primary,
                    // DEĞİŞİKLİK: Masaüstünde okunmamış mesaj rozeti daha da daraltıldı (16 -> 14)
                    minWidth: scale(isDesktop ? 14 : 20),
                    height: scale(isDesktop ? 14 : 20),
                    borderRadius: scale(isDesktop ? 7 : 10),
                    marginLeft: scale(isDesktop ? 4 : 8),
                  },
                ]}
              >
                <CustomText
                  style={{
                    // DEĞİŞİKLİK: Masaüstü badge yazı boyutu
                    fontSize: scale(isDesktop ? 8 : 11),
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </CustomText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
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
  info: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
