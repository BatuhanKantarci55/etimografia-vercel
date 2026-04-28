import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface PostPreviewProps {
  post: {
    post_id: string;
    post_type: string;
    content: string;
    image_url: string | null;
    username: string;
  };
  onPress?: () => void;
}

export default function PostPreview({ post, onPress }: PostPreviewProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: scale(12),
          borderWidth: 1,
          borderColor: colors.text + "10",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Ionicons name="repeat" size={scale(14)} color={colors.primary} />
        <CustomText
          style={{
            fontSize: scale(11),
            color: colors.primary,
            marginLeft: scale(4),
          }}
        >
          Gönderi paylaştı
        </CustomText>
      </View>

      <View style={styles.content}>
        {/* Görsel varsa - tam genişlikte göster */}
        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={[
              styles.image,
              {
                width: "100%",
                height: undefined,
                aspectRatio: 1,
                borderRadius: scale(8),
                marginBottom: scale(8),
              },
            ]}
            resizeMode="cover"
          />
        )}

        {/* Metin içeriği */}
        {post.content && post.post_type === "text" && (
          <CustomText
            style={{
              fontSize: scale(13),
              color: colors.text,
              marginBottom: scale(4),
              paddingHorizontal: scale(8),
            }}
            numberOfLines={3}
          >
            {post.content}
          </CustomText>
        )}

        {/* Kullanıcı bilgisi */}
        <View
          style={[
            styles.userInfo,
            { paddingHorizontal: scale(8), paddingBottom: scale(8) },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={scale(12)}
            color={colors.text + "60"}
          />
          <CustomText
            style={{
              fontSize: scale(11),
              color: colors.text + "60",
              marginLeft: scale(4),
            }}
          >
            {post.username}
          </CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  content: {
    width: "100%",
  },
  image: {
    // Boyutlar inline style ile
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});
