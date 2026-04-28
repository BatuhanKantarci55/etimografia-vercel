import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface FollowSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: "followers" | "following") => void;
  currentType: "followers" | "following";
}

export default function FollowSelector({
  visible,
  onClose,
  onSelect,
  currentType,
}: FollowSelectorProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
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
          {/* Takipçiler */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                padding: scale(12),
                borderRadius: scale(8),
                backgroundColor:
                  currentType === "followers"
                    ? colors.primary + "20"
                    : "transparent",
              },
            ]}
            onPress={() => {
              onSelect("followers");
              onClose();
            }}
          >
            <Ionicons
              name="people"
              size={scale(20)}
              color={currentType === "followers" ? colors.primary : colors.text}
            />
            <CustomText
              style={[
                styles.menuText,
                {
                  fontSize: scale(16),
                  color:
                    currentType === "followers" ? colors.primary : colors.text,
                  marginLeft: scale(12),
                  fontWeight: currentType === "followers" ? "600" : "400",
                },
              ]}
            >
              Takipçiler
            </CustomText>
            {currentType === "followers" && (
              <Ionicons
                name="checkmark"
                size={scale(18)}
                color={colors.primary}
                style={{ marginLeft: "auto" }}
              />
            )}
          </TouchableOpacity>

          {/* Takip Edilenler */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                padding: scale(12),
                borderRadius: scale(8),
                backgroundColor:
                  currentType === "following"
                    ? colors.primary + "20"
                    : "transparent",
              },
            ]}
            onPress={() => {
              onSelect("following");
              onClose();
            }}
          >
            <Ionicons
              name="person-add"
              size={scale(20)}
              color={currentType === "following" ? colors.primary : colors.text}
            />
            <CustomText
              style={[
                styles.menuText,
                {
                  fontSize: scale(16),
                  color:
                    currentType === "following" ? colors.primary : colors.text,
                  marginLeft: scale(12),
                  fontWeight: currentType === "following" ? "600" : "400",
                },
              ]}
            >
              Takip Edilenler
            </CustomText>
            {currentType === "following" && (
              <Ionicons
                name="checkmark"
                size={scale(18)}
                color={colors.primary}
                style={{ marginLeft: "auto" }}
              />
            )}
          </TouchableOpacity>

          {/* İptal */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                padding: scale(12),
                borderRadius: scale(8),
              },
            ]}
            onPress={onClose}
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
  );
}

const styles = StyleSheet.create({
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
