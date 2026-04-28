import CustomText from "@components/CustomText";
import ConversationItem from "@components/Messages/ConversationItem";
import { useMessages } from "@contexts/MessageContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router, useGlobalSearchParams } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

export default function ConversationList() {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop içeri alındı
  const { scale, isDesktop } = useResponsive();
  const { conversations, loading, refreshing, fetchConversations } =
    useMessages();

  // Global parametrelerden seçili olan sohbetin ID'sini (Varsa) okuyoruz
  const params = useGlobalSearchParams();
  const selectedId = Array.isArray(params.id) ? params.id[0] : params.id;

  const handleConversationPress = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const renderItem = ({ item }: { item: any }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleConversationPress(item.id)}
      isSelected={isDesktop && selectedId === item.id}
    />
  );

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      // DEĞİŞİKLİK: Masaüstünde liste iç boşlukları (padding) daraltıldı
      contentContainerStyle={[styles.list, isDesktop && { padding: scale(8) }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchConversations(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="chatbubble-outline"
            size={scale(isDesktop ? 32 : 64)}
            color={colors.text + "40"}
          />
          <CustomText
            style={[
              styles.emptyText,
              {
                fontSize: scale(isDesktop ? 12 : 16),
                color: colors.text + "60",
                marginTop: scale(isDesktop ? 8 : 16),
                textAlign: "center",
              },
            ]}
          >
            Henüz hiç mesajınız yok.
          </CustomText>
          <CustomText
            style={{
              fontSize: scale(isDesktop ? 10 : 14),
              color: colors.text + "40",
              marginTop: scale(isDesktop ? 4 : 8),
              textAlign: "center",
            }}
          >
            Yeni bir sohbet başlatmak için + butonuna tıklayın
          </CustomText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  emptyText: {
    fontWeight: "500",
  },
});
