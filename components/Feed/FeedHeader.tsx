import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface FeedHeaderProps {
  username?: string;
  onPostPress?: () => void;
  onMessagePress?: () => void;
}

export default function FeedHeader({
  username = "Akış",
  onPostPress,
  onMessagePress,
}: FeedHeaderProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          // DEĞİŞİKLİK: Masaüstü için dikey boşluklar ve yükseklik orantılı olarak küçültüldü
          paddingTop: scale(isDesktop ? 4 : 10),
          paddingBottom: scale(isDesktop ? 4 : 10),
          height: scale(isDesktop ? 40 : 60),
        },
      ]}
    >
      {/* Sol: Kalem-kağıt ikonu (Gönderi paylaşımı) */}
      <TouchableOpacity
        style={[
          styles.iconButton,
          {
            width: scale(isDesktop ? 28 : 40),
            height: scale(isDesktop ? 28 : 40),
          },
        ]}
        onPress={onPostPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="create-outline"
          size={scale(isDesktop ? 18 : 24)}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Orta: Kullanıcı adı */}
      <CustomText
        variant="subtitle"
        style={[
          styles.username,
          { fontSize: scale(isDesktop ? 14 : 18), color: colors.text },
        ]}
      >
        {username}
      </CustomText>

      {/* Sağ: Mesaj balonu ikonu (DM kısmı) */}
      <TouchableOpacity
        style={[
          styles.iconButton,
          {
            width: scale(isDesktop ? 28 : 40),
            height: scale(isDesktop ? 28 : 40),
          },
        ]}
        onPress={onMessagePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chatbubble-outline"
          size={scale(isDesktop ? 18 : 24)}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 100,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  username: {
    fontWeight: "600",
    textAlign: "center",
  },
});
