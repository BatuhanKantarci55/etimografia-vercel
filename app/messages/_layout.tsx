import CustomText from "@components/CustomText";
import ConversationList from "@components/Messages/ConversationList";
import NewConversationModal from "@components/Messages/NewConversationModal";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { Slot, Stack, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function MessagesLayout() {
  const { isDesktop, scale } = useResponsive();
  const { colors } = useTheme();
  const [newChatVisible, setNewChatVisible] = useState(false);

  // DEĞİŞİKLİK: Eğer mobildeysek standart yapıyı render et (Asla etkilenmez)
  if (!isDesktop) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
      </Stack>
    );
  }

  // DEĞİŞİKLİK: Masaüstü için navbar yüksekliği biraz daha küçültüldü (45 -> 40)
  const navbarHeight = scale(40);

  return (
    <View
      style={[styles.desktopContainer, { backgroundColor: colors.background }]}
    >
      {/* SOL KOLON - Sohbet Listesi */}
      <View
        style={[
          styles.sidebar,
          {
            // DEĞİŞİKLİK: Masaüstü için sol kolon genişliği daha da daraltıldı (260 -> 240)
            width: scale(240),
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View
          style={[
            styles.sidebarHeader,
            { height: navbarHeight, borderBottomColor: colors.border },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginRight: scale(6) }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={scale(16)}
                color={colors.text}
              />
            </TouchableOpacity>
            <CustomText
              style={{
                fontSize: scale(14),
                fontWeight: "600",
                color: colors.text,
              }}
            >
              Mesajlar
            </CustomText>
          </View>
          <TouchableOpacity
            onPress={() => setNewChatVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={scale(16)}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <ConversationList />
        </View>
        <NewConversationModal
          visible={newChatVisible}
          onClose={() => setNewChatVisible(false)}
        />
      </View>

      {/* SAĞ KOLON - Sohbet Ekranı (veya seçiniz uyarısı) */}
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    borderRightWidth: 1,
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12, // 16 -> 12
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    position: "relative",
  },
});
