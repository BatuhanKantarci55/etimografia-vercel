import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

interface MessageInputProps {
  onSend: (content: string, type?: string) => void;
  replyToMessage?: any;
  onCancelReply?: () => void;
}

export default function MessageInput({
  onSend,
  replyToMessage,
  onCancelReply,
}: MessageInputProps) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleChangeText = (text: string) => {
    setMessage(text);
  };

  const getAvatarSource = () => {
    const avatarIndex = profile?.avatar_index || 0;
    return allAvatars[avatarIndex % allAvatars.length];
  };

  return (
    <View>
      {/* Cevap gösterge çubuğu */}
      {replyToMessage && (
        <View
          style={[
            styles.replyBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.text + "20",
              // DEĞİŞİKLİK: Masaüstü padding küçültüldü
              paddingHorizontal: scale(isDesktop ? 12 : 16),
              paddingVertical: scale(isDesktop ? 6 : 8),
            },
          ]}
        >
          <View style={styles.replyContent}>
            <View
              style={[styles.replyLine, { backgroundColor: colors.primary }]}
            />
            <View style={styles.replyInfo}>
              <CustomText
                style={{
                  // DEĞİŞİKLİK: Masaüstü font boyutu küçültüldü
                  fontSize: scale(isDesktop ? 10 : 12),
                  color: colors.primary,
                  fontWeight: "500",
                }}
              >
                @{replyToMessage.sender?.username}
              </CustomText>
              <CustomText
                style={{
                  fontSize: scale(isDesktop ? 10 : 12),
                  color: colors.text + "80",
                  marginTop: scale(2),
                }}
                numberOfLines={1}
              >
                {replyToMessage.content}
              </CustomText>
            </View>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.closeButton}>
            <Ionicons
              name="close"
              size={scale(isDesktop ? 16 : 20)}
              color={colors.text + "60"}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Input alanı */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.text + "10",
            paddingBottom: insets.bottom || scale(isDesktop ? 8 : 10),
            // DEĞİŞİKLİK: Masaüstü padding küçültüldü
            paddingTop: scale(isDesktop ? 8 : 12),
            paddingHorizontal: scale(isDesktop ? 12 : 16),
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          {/* Avatar */}
          <Image
            source={getAvatarSource()}
            style={[
              styles.avatar,
              {
                // DEĞİŞİKLİK: Masaüstü avatar boyutu küçültüldü (32 -> 24)
                width: scale(isDesktop ? 24 : 32),
                height: scale(isDesktop ? 24 : 32),
                borderRadius: scale(isDesktop ? 12 : 16),
                marginRight: scale(isDesktop ? 6 : 8),
              },
            ]}
            resizeMode="cover"
          />

          {/* Input alanı */}
          <View
            style={[
              styles.inputField,
              {
                backgroundColor: colors.card,
                flex: 1,
                // DEĞİŞİKLİK: Masaüstü input kutusu iç boşlukları küçültüldü
                paddingVertical: scale(isDesktop ? 2 : 4),
                paddingHorizontal: scale(isDesktop ? 8 : 12),
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  color: colors.text,
                  // DEĞİŞİKLİK: Masaüstü font boyutu küçültüldü
                  fontSize: scale(isDesktop ? 12 : 14),
                  fontFamily: "Nunito-Regular",
                  paddingVertical: scale(isDesktop ? 6 : 8),
                },
              ]}
              placeholder="Mesaj yaz..."
              placeholderTextColor={colors.text + "60"}
              value={message}
              onChangeText={handleChangeText}
              multiline={false}
              maxLength={1000}
              // DEĞİŞİKLİK: Enter tuşuyla (web'de) anında gönderim için eklendi
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false} // Enter sonrası klavyenin/fokusun kapanmasını engeller
            />
          </View>

          {/* Gönder butonu - uçak ikonu */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: message.trim()
                  ? colors.primary
                  : colors.text + "20",
                // DEĞİŞİKLİK: Masaüstü gönder butonu boyutu küçültüldü (40 -> 28)
                width: scale(isDesktop ? 28 : 40),
                height: scale(isDesktop ? 28 : 40),
                borderRadius: scale(isDesktop ? 14 : 20),
                marginLeft: scale(isDesktop ? 6 : 8),
              },
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              // DEĞİŞİKLİK: Uçak ikonu boyutu küçültüldü
              size={scale(isDesktop ? 12 : 20)}
              color={message.trim() ? "white" : colors.text + "60"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
  },
  replyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  replyLine: {
    width: 4,
    height: "100%",
    marginRight: 8,
    borderRadius: 2,
  },
  replyInfo: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {},
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
  },
  input: {
    flex: 1,
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
