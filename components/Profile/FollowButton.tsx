import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useFollow } from "@contexts/FollowContext";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (newState: boolean) => void;
  size?: "small" | "medium";
}

export default function FollowButton({
  userId,
  isFollowing,
  onFollowChange,
  size = "medium",
}: FollowButtonProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const { followUser, unfollowUser } = useFollow();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (!user) {
      Alert.alert("Giriş Yapın", "Bu işlemi yapmak için giriş yapmalısınız.");
      return;
    }

    setLoading(true);

    if (isFollowing) {
      const { error } = await unfollowUser(userId);
      if (!error && onFollowChange) {
        onFollowChange(false);
      }
    } else {
      const { error } = await followUser(userId);
      if (!error && onFollowChange) {
        onFollowChange(true);
      }
    }

    setLoading(false);
  };

  const buttonSize =
    size === "small"
      ? {
          paddingHorizontal: scale(5),
          paddingVertical: scale(5),
          fontSize: scale(13),
          minWidth: scale(60), // Minimum genişlik
        }
      : {
          paddingHorizontal: scale(6),
          paddingVertical: scale(6),
          fontSize: scale(13),
          minWidth: scale(60),
        };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isFollowing ? "transparent" : colors.primary,
          borderWidth: isFollowing ? 1 : 0,
          borderColor: isFollowing ? colors.text + "40" : "transparent",
          paddingHorizontal: buttonSize.paddingHorizontal,
          paddingVertical: buttonSize.paddingVertical,
          minWidth: buttonSize.minWidth, // Minimum genişlik
          borderRadius: size === "small" ? scale(10) : scale(16),
        },
      ]}
      onPress={handlePress}
      disabled={loading}
    >
      <CustomText
        style={{
          fontSize: buttonSize.fontSize,
          color: isFollowing ? colors.text + "80" : "white",
          fontWeight: "600",
          textAlign: "center",
        }}
        numberOfLines={1} // Tek satırda göster
      >
        {loading ? "..." : isFollowing ? "Takip Ediliyor" : "Takip Et"}
      </CustomText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
