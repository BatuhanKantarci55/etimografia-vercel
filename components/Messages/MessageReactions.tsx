import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface MessageReactionsProps {
  reactions: any[];
  messageId: string;
  currentUserId: string;
  onReaction: (messageId: string, reaction: string) => void;
  onRemoveReaction: (messageId: string) => void;
}

const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

export default function MessageReactions({
  reactions,
  messageId,
  currentUserId,
  onReaction,
  onRemoveReaction,
}: MessageReactionsProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const [pickerVisible, setPickerVisible] = useState(false);

  // Tepkileri grupla
  const groupedReactions: { [key: string]: any[] } = {};
  reactions.forEach((reaction) => {
    if (!groupedReactions[reaction.reaction]) {
      groupedReactions[reaction.reaction] = [];
    }
    groupedReactions[reaction.reaction].push(reaction);
  });

  const hasUserReacted = reactions.some((r) => r.user_id === currentUserId);
  const userReaction = reactions.find((r) => r.user_id === currentUserId);

  const handleReactionPress = (reaction: string) => {
    if (userReaction?.reaction === reaction) {
      onRemoveReaction(messageId);
    } else {
      onReaction(messageId, reaction);
    }
    setPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Tepki butonları */}
      <View style={styles.reactionsContainer}>
        {Object.entries(groupedReactions).map(([reaction, users]) => (
          <TouchableOpacity
            key={reaction}
            style={[
              styles.reactionBadge,
              {
                backgroundColor: colors.card + "80",
                borderRadius: scale(12),
                paddingHorizontal: scale(6),
                paddingVertical: scale(2),
                marginRight: scale(4),
                borderWidth: userReaction?.reaction === reaction ? 1 : 0,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => {
              if (userReaction?.reaction === reaction) {
                onRemoveReaction(messageId);
              } else {
                onReaction(messageId, reaction);
              }
            }}
          >
            <CustomText style={{ fontSize: scale(12), marginRight: scale(2) }}>
              {reaction}
            </CustomText>
            <CustomText
              style={{
                fontSize: scale(11),
                color: colors.text + "80",
              }}
            >
              {users.length}
            </CustomText>
          </TouchableOpacity>
        ))}

        {/* Tepki ekle butonu */}
        <TouchableOpacity
          style={[
            styles.addReactionButton,
            {
              backgroundColor: colors.card + "80",
              borderRadius: scale(12),
              paddingHorizontal: scale(6),
              paddingVertical: scale(2),
            },
          ]}
          onPress={() => setPickerVisible(true)}
        >
          <CustomText
            style={{ fontSize: scale(14), color: colors.text + "60" }}
          >
            +
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Tepki seçici modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: colors.card,
                borderRadius: scale(16),
                padding: scale(12),
              },
            ]}
          >
            <View style={styles.reactionsGrid}>
              {REACTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction}
                  style={[
                    styles.reactionOption,
                    {
                      padding: scale(8),
                      borderRadius: scale(8),
                      backgroundColor:
                        userReaction?.reaction === reaction
                          ? colors.primary + "20"
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleReactionPress(reaction)}
                >
                  <CustomText style={{ fontSize: scale(24) }}>
                    {reaction}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tepki kaldır */}
            {hasUserReacted && (
              <TouchableOpacity
                style={[
                  styles.removeButton,
                  {
                    marginTop: scale(8),
                    padding: scale(12),
                    borderRadius: scale(8),
                    backgroundColor: colors.text + "10",
                  },
                ]}
                onPress={() => {
                  onRemoveReaction(messageId);
                  setPickerVisible(false);
                }}
              >
                <CustomText
                  style={{
                    fontSize: scale(14),
                    color: colors.text + "80",
                    textAlign: "center",
                  }}
                >
                  Tepkiyi Kaldır
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    alignItems: "flex-start",
  },
  reactionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  reactionBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  addReactionButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    width: "80%",
    maxWidth: 300,
  },
  reactionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  reactionOption: {
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  removeButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
