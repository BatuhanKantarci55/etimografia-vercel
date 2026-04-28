import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import ConversationList from "@components/Messages/ConversationList";
import NewConversationModal from "@components/Messages/NewConversationModal";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import { useState } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [newChatVisible, setNewChatVisible] = useState(false);

  const statusBarHeight =
    Platform.OS === "ios" ? scale(40) : StatusBar.currentHeight || scale(20);
  const navbarHeight = Platform.OS === "ios" ? scale(90) : scale(70);

  if (isDesktop) {
    return (
      <BackgroundImage overlayOpacity={0.03}>
        <View style={styles.desktopEmptyContainer}>
          {/* DEĞİŞİKLİK: Masaüstünde "Sohbet için birini seçiniz" ikonu ve yazısı küçültüldü */}
          <Ionicons
            name="chatbubbles-outline"
            size={scale(40)}
            color={colors.text + "40"}
          />
          <CustomText
            style={{
              fontSize: scale(13),
              color: colors.text + "60",
              marginTop: scale(12),
            }}
          >
            Sohbet için birini seçiniz
          </CustomText>
        </View>
      </BackgroundImage>
    );
  }

  // MOBİL: Orijinal çalışma yapısı bozulmadı
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
        <View style={styles.navbarContent}>
          <View style={[styles.navbarSide, { width: scale(40) }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.iconContainer,
                { width: scale(40), height: scale(40) },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={scale(24)}
                color={colors.text || "#000000"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.navbarCenter}>
            <CustomText
              style={{
                fontSize: scale(18),
                fontWeight: "600",
                color: colors.text,
              }}
            >
              Mesajlar
            </CustomText>
          </View>

          <View style={[styles.navbarSide, { width: scale(40) }]}>
            <TouchableOpacity
              onPress={() => setNewChatVisible(true)}
              style={[
                styles.iconContainer,
                { width: scale(40), height: scale(40) },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={scale(24)}
                color={colors.text || "#000000"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, marginTop: navbarHeight }}>
        <ConversationList />
      </View>

      <NewConversationModal
        visible={newChatVisible}
        onClose={() => setNewChatVisible(false)}
      />
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
    paddingHorizontal: 16,
  },
  navbarSide: {
    alignItems: "center",
    justifyContent: "center",
  },
  navbarCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  desktopEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
