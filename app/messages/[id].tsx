import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import MessageInput from "@components/Messages/MessageInput";
import MessageList from "@components/Messages/MessageList";
import { useAuth } from "@contexts/AuthContext";
import { useMessages } from "@contexts/MessageContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { getAvatarSource } from "@utils/avatarUtils";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MessageRoomScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { id } = useLocalSearchParams();
  const conversationId = Array.isArray(id) ? id[0] : id;

  const {
    currentConversation,
    messages,
    loading,
    getConversation,
    clearMessages,
    sendMessage,
    addReaction,
    removeReaction,
    editMessage,
    deleteForEveryone,
    deleteForMe,
  } = useMessages();

  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  const inputTranslateY = useRef(new Animated.Value(0)).current;
  const messageListRef = useRef<any>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);

        Animated.timing(inputTranslateY, {
          toValue: -(e.endCoordinates.height + 10),
          duration: 250,
          useNativeDriver: true,
        }).start();
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);

        Animated.timing(inputTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
      getConversation(conversationId);
    }

    return () => {
      clearMessages();
    };
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        messageListRef.current?.scrollToEnd();
      }, 200);
    }
  }, [messages.length, loading]);

  const handleSendMessage = async (content: string, type: string = "text") => {
    if (!content.trim()) return;

    await sendMessage(
      conversationId,
      content,
      type,
      replyToMessage?.id || null,
    );
    setReplyToMessage(null);
  };

  const handleReply = (message: any) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    await addReaction(messageId, reaction);
  };

  const handleRemoveReaction = async (messageId: string) => {
    await removeReaction(messageId);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const { error } = await editMessage(messageId, newContent);
    if (error) {
      console.error("Mesaj düzenlenemedi:", error);
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    const { error } = await deleteForEveryone(messageId);
    if (error) {
      console.error("Mesaj herkesten silinemedi:", error);
    }
  };

  const handleDeleteForMe = async (messageId: string) => {
    const { error } = await deleteForMe(messageId);
    if (error) {
      console.error("Mesaj sadece benden silinemedi:", error);
    }
  };

  const handleClearChat = async () => {
    for (const message of messages) {
      await deleteForMe(message.id);
    }
    setMenuVisible(false);
  };

  const handleReplyMessagePress = (messageId: string) => {
    const visibleMessages = messages.filter((msg) => !msg.deleted_for_sender);
    const messageIndex = visibleMessages.findIndex((m) => m.id === messageId);

    if (messageIndex !== -1) {
      messageListRef.current?.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5,
      });

      setHighlightedMessageId(messageId);

      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const visibleMessages = messages.filter((msg) => !msg.deleted_for_sender);

    const results = visibleMessages.filter(
      (msg) =>
        msg.type === "text" &&
        msg.content?.toLowerCase().includes(text.toLowerCase()),
    );

    setSearchResults(results);

    if (results.length > 0) {
      setCurrentSearchIndex(0);

      const firstResultIndex = visibleMessages.findIndex(
        (m) => m.id === results[0].id,
      );

      if (firstResultIndex !== -1) {
        setTimeout(() => {
          messageListRef.current?.scrollToIndex({
            index: firstResultIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }, 100);
      }
    } else {
      setCurrentSearchIndex(-1);
    }
  };

  const handleNextSearch = () => {
    if (searchResults.length === 0) return;

    let nextIndex = currentSearchIndex + 1;

    if (nextIndex >= searchResults.length) {
      nextIndex = 0;
    }

    setCurrentSearchIndex(nextIndex);

    const visibleMessages = messages.filter((msg) => !msg.deleted_for_sender);
    const targetMessage = searchResults[nextIndex];
    const messageIndex = visibleMessages.findIndex(
      (m) => m.id === targetMessage.id,
    );

    if (messageIndex !== -1 && messageIndex < visibleMessages.length) {
      messageListRef.current?.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const handlePrevSearch = () => {
    if (searchResults.length === 0) return;

    let prevIndex = currentSearchIndex - 1;

    if (prevIndex < 0) {
      prevIndex = searchResults.length - 1;
    }

    setCurrentSearchIndex(prevIndex);

    const visibleMessages = messages.filter((msg) => !msg.deleted_for_sender);
    const targetMessage = searchResults[prevIndex];
    const messageIndex = visibleMessages.findIndex(
      (m) => m.id === targetMessage.id,
    );

    if (messageIndex !== -1 && messageIndex < visibleMessages.length) {
      messageListRef.current?.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const handleCloseSearch = () => {
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };

  // getAvatarSource artık avatarUtils'den geliyor, bu fonksiyona gerek yok
  // const getAvatarSource = (avatarIndex: number) => {
  //   return allAvatars[avatarIndex % allAvatars.length];
  // };

  const formatLastSeen = () => {
    return "Çevrimiçi";
  };

  const statusBarHeight = isDesktop
    ? 0
    : Platform.OS === "ios"
      ? scale(40)
      : StatusBar.currentHeight || scale(20);
  const navbarHeight = isDesktop
    ? scale(40)
    : Platform.OS === "ios"
      ? scale(90)
      : scale(70);

  if (loading && !currentConversation) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </BackgroundImage>
    );
  }

  const otherUser = currentConversation?.other_user;

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
        },
      ]}
      activeOpacity={1}
      onPress={() => setMenuVisible(false)}
    >
      <View
        style={[
          styles.menuContainer,
          {
            backgroundColor: colors.card,
            borderRadius: scale(12),
            padding: scale(isDesktop ? 4 : 8),
          },
          isDesktop && { width: scale(120), maxWidth: scale(140) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              padding: scale(isDesktop ? 6 : 16),
              borderRadius: scale(8),
            },
          ]}
          onPress={() => {
            setSearchMode(true);
            setMenuVisible(false);
          }}
        >
          <Ionicons
            name="search"
            size={scale(isDesktop ? 12 : 20)}
            color={colors.primary}
          />
          <CustomText
            style={[
              styles.menuText,
              {
                fontSize: scale(isDesktop ? 10 : 16),
                color: colors.text,
                marginLeft: scale(isDesktop ? 6 : 12),
              },
            ]}
          >
            Sohbette Ara
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              padding: scale(isDesktop ? 6 : 16),
              borderRadius: scale(8),
            },
          ]}
          onPress={handleClearChat}
        >
          <Ionicons
            name="trash-outline"
            size={scale(isDesktop ? 12 : 20)}
            color="#FF3B30"
          />
          <CustomText
            style={[
              styles.menuText,
              {
                fontSize: scale(isDesktop ? 10 : 16),
                color: "#FF3B30",
                marginLeft: scale(isDesktop ? 6 : 12),
              },
            ]}
          >
            Sohbeti Temizle
          </CustomText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View
        style={[
          styles.navbar,
          {
            height: navbarHeight,
            paddingTop: statusBarHeight,
            backgroundColor: colors.card,
          },
        ]}
      >
        {searchMode ? (
          <View style={styles.searchModeContent}>
            <TouchableOpacity
              onPress={handleCloseSearch}
              style={[
                styles.iconContainer,
                {
                  width: scale(isDesktop ? 16 : 32),
                  height: scale(isDesktop ? 16 : 32),
                  marginRight: scale(8),
                },
              ]}
            >
              <Ionicons
                name="close"
                size={scale(isDesktop ? 12 : 20)}
                color={colors.text || "#000000"}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.searchInputContainer,
                {
                  backgroundColor: colors.background,
                  borderRadius: scale(6),
                  flex: 1,
                  marginRight: scale(6),
                },
              ]}
            >
              <Ionicons
                name="search"
                size={scale(isDesktop ? 10 : 18)}
                color={colors.text + "60"}
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: colors.text,
                    fontSize: scale(isDesktop ? 10 : 14),
                    paddingVertical: scale(isDesktop ? 1 : 6),
                  },
                ]}
                placeholder="Sohbette ara..."
                placeholderTextColor={colors.text + "60"}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchNavContainer}>
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 9 : 12),
                    color: colors.text + "60",
                    marginRight: scale(8),
                  }}
                >
                  {currentSearchIndex + 1}/{searchResults.length}
                </CustomText>
                <TouchableOpacity
                  onPress={handlePrevSearch}
                  style={styles.searchNavButton}
                  disabled={searchResults.length === 0}
                >
                  <Ionicons
                    name="chevron-up"
                    size={scale(isDesktop ? 10 : 18)}
                    color={
                      searchResults.length > 0
                        ? colors.text
                        : colors.text + "40"
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNextSearch}
                  style={styles.searchNavButton}
                  disabled={searchResults.length === 0}
                >
                  <Ionicons
                    name="chevron-down"
                    size={scale(isDesktop ? 10 : 18)}
                    color={
                      searchResults.length > 0
                        ? colors.text
                        : colors.text + "40"
                    }
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.navbarContent}>
            <View style={styles.leftSection}>
              {!isDesktop && (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[
                    styles.iconContainer,
                    {
                      width: scale(32),
                      height: scale(32),
                      marginRight: scale(8),
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-back"
                    size={scale(20)}
                    color={colors.text || "#000000"}
                  />
                </TouchableOpacity>
              )}

              {/* Avatar */}
              {otherUser && (
                <View
                  style={[
                    styles.headerAvatar,
                    {
                      width: scale(isDesktop ? 24 : 32),
                      height: scale(isDesktop ? 24 : 32),
                      borderRadius: scale(isDesktop ? 12 : 16),
                      marginRight: scale(isDesktop ? 6 : 8),
                      overflow: "hidden",
                    },
                  ]}
                >
                  <Image
                    source={getAvatarSource(otherUser.avatar_index || 0)}
                    style={styles.headerAvatarImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              <View style={styles.userInfo}>
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 12 : 14),
                    fontWeight: "600",
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {otherUser?.username || "Sohbet"}
                </CustomText>
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 8 : 11),
                    color: colors.primary,
                  }}
                  numberOfLines={1}
                >
                  {formatLastSeen()}
                </CustomText>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={[
                styles.iconContainer,
                {
                  width: scale(isDesktop ? 20 : 32),
                  height: scale(isDesktop ? 20 : 32),
                },
              ]}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={scale(isDesktop ? 12 : 18)}
                color={colors.text || "#000000"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ flex: 1, marginTop: navbarHeight }}>
        <MessageList
          ref={messageListRef}
          messages={messages}
          currentUserId={user?.id || ""}
          onReply={handleReply}
          onReaction={handleReaction}
          onRemoveReaction={handleRemoveReaction}
          onEdit={handleEditMessage}
          onDeleteForEveryone={handleDeleteForEveryone}
          onDeleteForMe={handleDeleteForMe}
          onReplyMessagePress={handleReplyMessagePress}
          highlightedMessageId={highlightedMessageId}
          searchQuery={searchQuery}
          searchResults={searchResults}
        />
      </View>

      <Animated.View
        style={[
          styles.inputContainer,
          {
            transform: [{ translateY: inputTranslateY }],
            backgroundColor: colors.background,
          },
        ]}
      >
        <MessageInput
          onSend={handleSendMessage}
          replyToMessage={replyToMessage}
          onCancelReply={handleCancelReply}
        />
      </Animated.View>

      <Modal
        visible={menuVisible && !isDesktop}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        {renderActionMenuContent()}
      </Modal>

      {isDesktop && menuVisible && renderActionMenuContent()}
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  navbarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchModeContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  headerAvatar: {
    overflow: "hidden",
  },
  headerAvatarImage: {
    width: "100%",
    height: "100%",
  },
  userInfo: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
  },
  searchNavContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchNavButton: {
    padding: 4,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
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
