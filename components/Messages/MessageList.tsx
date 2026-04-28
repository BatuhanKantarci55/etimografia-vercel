import CustomText from "@components/CustomText";
import MessageItem from "@components/Messages/MessageItem";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

interface MessageListProps {
  messages: any[];
  currentUserId: string;
  onReply: (message: any) => void;
  onReaction: (messageId: string, reaction: string) => void;
  onRemoveReaction: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => Promise<any>;
  onDeleteForEveryone?: (messageId: string) => Promise<any>;
  onDeleteForMe?: (messageId: string) => Promise<any>;
  onReplyMessagePress?: (messageId: string) => void;
  highlightedMessageId?: string | null;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  searchQuery?: string;
  searchResults?: any[];
}

const MessageList = forwardRef<any, MessageListProps>(
  (
    {
      messages,
      currentUserId,
      onReply,
      onReaction,
      onRemoveReaction,
      onEdit,
      onDeleteForEveryone,
      onDeleteForMe,
      onReplyMessagePress,
      highlightedMessageId,
      loading,
      hasMore,
      onLoadMore,
      searchQuery,
      searchResults,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const { scale } = useResponsive();
    const flatListRef = useRef<FlatList>(null);

    useImperativeHandle(ref, () => ({
      scrollToIndex: (options: any) => {
        flatListRef.current?.scrollToIndex(options);
      },
      scrollToEnd: () => {
        flatListRef.current?.scrollToEnd({ animated: true });
      },
    }));

    // Mesajlar yüklendiğinde en alta kaydır
    useEffect(() => {
      if (messages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    }, [messages.length]);

    const handleLoadMore = () => {
      if (hasMore && onLoadMore && !loading) {
        onLoadMore();
      }
    };

    // Sadece benim için silinmemiş mesajları filtrele
    const visibleMessages = messages.filter((msg) => {
      if (msg.deleted_for_sender) {
        return false;
      }
      return true;
    });

    const renderItem = ({ item }: { item: any }) => {
      const isHighlighted = highlightedMessageId === item.id;
      const isSearchHighlight =
        searchQuery &&
        item.type === "text" &&
        item.content?.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        <View
          style={
            isSearchHighlight
              ? { backgroundColor: colors.primary + "20" }
              : null
          }
        >
          <MessageItem
            message={item}
            isOwnMessage={item.sender_id === currentUserId}
            onReply={onReply}
            onReaction={onReaction}
            onRemoveReaction={onRemoveReaction}
            onEdit={onEdit}
            onDeleteForEveryone={onDeleteForEveryone}
            onDeleteForMe={onDeleteForMe}
            onReplyMessagePress={onReplyMessagePress}
            isHighlighted={isHighlighted}
          />
        </View>
      );
    };

    const renderDateSeparator = (date: string) => {
      const today = new Date();
      const messageDate = new Date(date);

      let dateText = "";
      if (messageDate.toDateString() === today.toDateString()) {
        dateText = "Bugün";
      } else {
        dateText = messageDate.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

      return (
        <View style={styles.dateSeparator}>
          <View
            style={[styles.dateLine, { backgroundColor: colors.text + "20" }]}
          />
          <CustomText
            style={{
              fontSize: scale(12),
              color: colors.text + "60",
              marginHorizontal: scale(12),
            }}
          >
            {dateText}
          </CustomText>
          <View
            style={[styles.dateLine, { backgroundColor: colors.text + "20" }]}
          />
        </View>
      );
    };

    // Mesajları tarihe göre grupla
    const renderItemWithSeparator = ({
      item,
      index,
    }: {
      item: any;
      index: number;
    }) => {
      const showDateSeparator =
        index === 0 ||
        new Date(item.created_at).toDateString() !==
          new Date(visibleMessages[index - 1]?.created_at).toDateString();

      return (
        <View>
          {showDateSeparator && renderDateSeparator(item.created_at)}
          {renderItem({ item })}
        </View>
      );
    };

    return (
      <FlatList
        ref={flatListRef}
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItemWithSeparator}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: scale(100),
          },
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading && hasMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

MessageList.displayName = "MessageList";

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default MessageList;
