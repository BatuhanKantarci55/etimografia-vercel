import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useMessages } from "@contexts/MessageContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getAvatarSource } from "@utils/avatarUtils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface NewConversationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NewConversationModal({
  visible,
  onClose,
}: NewConversationModalProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const { createConversation } = useMessages();

  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  const fetchUsers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Tüm kullanıcıları getir (kendin hariç)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_index")
        .neq("id", user.id)
        .order("username");

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Kullanıcılar alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = users.filter(
      (u) =>
        u.username.toLowerCase().includes(text.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(text.toLowerCase())),
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = async (targetUser: any) => {
    setLoading(true);
    const conversation = await createConversation(targetUser.id);
    setLoading(false);

    if (conversation) {
      onClose();
      router.push(`/message/${conversation.id}`);
    }
  };

  // getAvatarSource artık avatarUtils'den geliyor, bu fonksiyona gerek yok
  // const getAvatarSource = (avatarIndex: number) => {
  //   return allAvatars[avatarIndex % allAvatars.length];
  // };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        {
          backgroundColor: colors.card,
          marginBottom: scale(8),
          borderRadius: scale(12),
          padding: scale(12),
        },
      ]}
      onPress={() => handleSelectUser(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userContent}>
        <View
          style={[
            styles.avatar,
            {
              width: scale(50),
              height: scale(50),
              borderRadius: scale(25),
              marginRight: scale(12),
            },
          ]}
        >
          <Image
            source={getAvatarSource(item.avatar_index || 0)}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.userInfo}>
          <CustomText
            style={{
              fontSize: scale(16),
              fontWeight: "600",
              color: colors.text,
            }}
          >
            {item.username}
          </CustomText>
          {item.full_name && (
            <CustomText
              style={{
                fontSize: scale(13),
                color: colors.text + "80",
                marginTop: scale(2),
              }}
            >
              {item.full_name}
            </CustomText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Yeni Sohbet"
      height="80%"
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <View style={[styles.container, { padding: scale(16) }]}>
        {/* Arama */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.card,
              borderRadius: scale(12),
              marginBottom: scale(16),
              paddingHorizontal: scale(12),
            },
          ]}
        >
          <Ionicons name="search" size={scale(20)} color={colors.text + "60"} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.text,
                fontSize: scale(14),
                paddingVertical: scale(12),
                marginLeft: scale(8),
              },
            ]}
            placeholder="Kullanıcı ara..."
            placeholderTextColor={colors.text + "60"}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Kullanıcı Listesi */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={scale(48)}
                  color={colors.text + "40"}
                />
                <CustomText
                  style={{
                    fontSize: scale(16),
                    color: colors.text + "60",
                    marginTop: scale(12),
                    textAlign: "center",
                  }}
                >
                  {searchQuery
                    ? "Kullanıcı bulunamadı."
                    : "Henüz hiç kullanıcı yok."}
                </CustomText>
              </View>
            }
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  userItem: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  userInfo: {
    flex: 1,
  },
});
