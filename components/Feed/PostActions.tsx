import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface PostActionsProps {
  stats: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    quotes?: number;
  };
  userLiked: boolean;
  userShared: boolean;
  userSaved: boolean;
  userQuoted?: boolean;
  onLike: () => void;
  onShare: () => void;
  onSave: () => void;
  onComment: () => void;
  onQuote: () => void;
  onSend?: () => void;
  showUsername?: boolean;
  username?: string;
  text?: string;
  postUserId?: string;
}

export default function PostActions({
  stats,
  userLiked,
  userShared,
  userSaved,
  userQuoted,
  onLike,
  onShare,
  onSave,
  onComment,
  onQuote,
  onSend,
  showUsername = false,
  username = "",
  text = "",
  postUserId,
}: PostActionsProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [shareMenuVisible, setShareMenuVisible] = useState(false);

  const isOwnPost = user?.id === postUserId;

  const handleSharePress = () => {
    setShareMenuVisible(true);
  };

  const handleRepost = () => {
    setShareMenuVisible(false);
    onShare();
  };

  const handleQuote = () => {
    setShareMenuVisible(false);
    onQuote();
  };

  const renderActionButton = (
    iconName: string,
    count: number,
    isActive: boolean,
    activeColor: string,
    onPress: () => void,
    disabled: boolean = false,
  ) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        {
          marginRight: scale(isDesktop ? 8 : 16),
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Ionicons
        name={iconName as any}
        size={scale(isDesktop ? 14 : 20)}
        color={isActive ? activeColor : colors.text + "80"}
      />
      {count > 0 && (
        <CustomText
          style={[
            styles.actionCount,
            {
              fontSize: scale(isDesktop ? 10 : 12),
              color: isActive ? activeColor : colors.text + "80",
              marginLeft: scale(4),
            },
          ]}
        >
          {count}
        </CustomText>
      )}
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingVertical: scale(isDesktop ? 4 : 12),
          paddingHorizontal: scale(12),
        },
      ]}
    >
      <Modal
        visible={shareMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShareMenuVisible(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.card,
                borderRadius: scale(12),
                padding: scale(8),
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  padding: scale(12),
                  borderRadius: scale(8),
                },
              ]}
              onPress={handleRepost}
            >
              <Ionicons name="repeat" size={scale(20)} color={colors.primary} />
              <CustomText
                style={[
                  styles.menuText,
                  {
                    fontSize: scale(16),
                    color: colors.text,
                    marginLeft: scale(12),
                  },
                ]}
              >
                Yeniden Paylaş
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  padding: scale(12),
                  borderRadius: scale(8),
                },
              ]}
              onPress={handleQuote}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={scale(20)}
                color={colors.primary}
              />
              <CustomText
                style={[
                  styles.menuText,
                  {
                    fontSize: scale(16),
                    color: colors.text,
                    marginLeft: scale(12),
                  },
                ]}
              >
                Alıntıla
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  padding: scale(12),
                  borderRadius: scale(8),
                },
              ]}
              onPress={() => setShareMenuVisible(false)}
            >
              <Ionicons
                name="close-outline"
                size={scale(20)}
                color={colors.text + "80"}
              />
              <CustomText
                style={[
                  styles.menuText,
                  {
                    fontSize: scale(16),
                    color: colors.text + "80",
                    marginLeft: scale(12),
                  },
                ]}
              >
                İptal
              </CustomText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          {renderActionButton(
            "chatbubble-outline",
            stats.comments,
            false,
            colors.text,
            onComment,
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                marginRight: scale(isDesktop ? 8 : 16),
                opacity: isOwnPost ? 0.5 : 1,
              },
            ]}
            onPress={handleSharePress}
            activeOpacity={0.7}
            disabled={isOwnPost}
          >
            <Ionicons
              name={userShared || userQuoted ? "repeat" : "repeat-outline"}
              size={scale(isDesktop ? 14 : 20)}
              color={userShared || userQuoted ? "#4CAF50" : colors.text + "80"}
            />
            {stats.shares + (stats.quotes || 0) > 0 && (
              <CustomText
                style={[
                  styles.actionCount,
                  {
                    fontSize: scale(isDesktop ? 10 : 12),
                    color:
                      userShared || userQuoted ? "#4CAF50" : colors.text + "80",
                    marginLeft: scale(4),
                  },
                ]}
              >
                {stats.shares + (stats.quotes || 0)}
              </CustomText>
            )}
          </TouchableOpacity>

          {renderActionButton(
            userLiked ? "heart" : "heart-outline",
            stats.likes,
            userLiked,
            "#FF3B30",
            onLike,
          )}

          {renderActionButton(
            "paper-plane-outline",
            0,
            false,
            colors.text,
            onSend || (() => {}),
          )}
        </View>

        <TouchableOpacity
          onPress={onSave}
          activeOpacity={0.7}
          style={styles.saveButton}
        >
          <Ionicons
            name={userSaved ? "bookmark" : "bookmark-outline"}
            size={scale(isDesktop ? 14 : 20)}
            color={userSaved ? "#007AFF" : colors.text + "80"}
          />
          {stats.saves > 0 && (
            <CustomText
              style={[
                styles.actionCount,
                {
                  fontSize: scale(isDesktop ? 10 : 12),
                  color: userSaved ? "#007AFF" : colors.text + "80",
                  marginLeft: scale(4),
                },
              ]}
            >
              {stats.saves}
            </CustomText>
          )}
        </TouchableOpacity>
      </View>

      {/* DÜZELTME: Açıklama metni iki kere görünmesin diye ve daha zarif olsun diye burada tutulup, boyutu ve dikey boşlukları azaltıldı */}
      {showUsername && (
        <View style={[styles.caption, { marginTop: scale(isDesktop ? 2 : 8) }]}>
          <CustomText
            style={{
              fontSize: scale(isDesktop ? 10 : 14), // DÜZELTME: Boyutlar daha da küçültüldü
              fontWeight: "600",
              color: colors.text,
            }}
          >
            {username}
          </CustomText>
          {text && (
            <CustomText
              fontFamily="medium" // DÜZELTME: Metin fontu medium yapıldı
              style={{
                fontSize: scale(isDesktop ? 10 : 14), // DÜZELTME: Boyutlar daha da küçültüldü
                color: colors.text + "80",
                marginLeft: scale(4),
              }}
            >
              {text.length > 50 ? text.substring(0, 50) + "..." : text}
            </CustomText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // DÜZELTME: Üstteki çizgi (borderTopWidth) tamamen kaldırıldı
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionCount: {
    fontWeight: "500",
  },
  caption: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 4,
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
});
