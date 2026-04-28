import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { Post } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getAvatarSource } from "@utils/avatarUtils";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface QuoteModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  onQuote: (quoteText: string) => Promise<void>;
}

export default function QuoteModal({
  visible,
  onClose,
  post,
  onQuote,
}: QuoteModalProps) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive(); // DEĞİŞİKLİK: isDesktop eklendi
  const [quoteText, setQuoteText] = useState("");
  const [loading, setLoading] = useState(false);

  const [myAvatarIndex, setMyAvatarIndex] = useState(
    profile?.avatar_index || 0,
  );
  const [myUsername, setMyUsername] = useState(
    profile?.username || "Kullanıcı",
  );

  const [postOwnerAvatarIndex, setPostOwnerAvatarIndex] = useState(
    post.avatar_index || 0,
  );
  const [postOwnerUsername, setPostOwnerUsername] = useState(
    post.username || "Kullanıcı",
  );
  const [postOwnerFullName, setPostOwnerFullName] = useState(
    post.full_name || null,
  );

  const myProfileSubscription = useRef<any>(null);
  const postOwnerSubscription = useRef<any>(null);

  useEffect(() => {
    if (!visible || !profile?.id) return;

    if (myProfileSubscription.current) {
      myProfileSubscription.current.unsubscribe();
    }
    if (postOwnerSubscription.current) {
      postOwnerSubscription.current.unsubscribe();
    }

    const fetchMyProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_index, username")
          .eq("id", profile.id)
          .single();

        if (error) {
          return;
        }

        if (data) {
          setMyAvatarIndex(data.avatar_index || 0);
          setMyUsername(data.username || "Kullanıcı");
        }
      } catch (error) {
        console.error("❌ QuoteModal - Error:", error);
      }
    };

    const fetchPostOwnerProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_index, username, full_name")
          .eq("id", post.user_id)
          .single();

        if (error) {
          return;
        }

        if (data) {
          setPostOwnerAvatarIndex(data.avatar_index || 0);
          setPostOwnerUsername(data.username || "Kullanıcı");
          setPostOwnerFullName(data.full_name || null);
        }
      } catch (error) {
        console.error("❌ QuoteModal - Error:", error);
      }
    };

    fetchMyProfile();
    fetchPostOwnerProfile();

    const mySub = supabase
      .channel(`quote-my-profile-${profile.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const newProfile = payload.new;

          if (newProfile.avatar_index !== undefined) {
            setMyAvatarIndex(newProfile.avatar_index);
          }
          if (newProfile.username) {
            setMyUsername(newProfile.username);
          }
        },
      )
      .subscribe();

    const ownerSub = supabase
      .channel(`quote-owner-${post.user_id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${post.user_id}`,
        },
        (payload) => {
          const newProfile = payload.new;

          if (newProfile.avatar_index !== undefined) {
            setPostOwnerAvatarIndex(newProfile.avatar_index);
          }
          if (newProfile.username) {
            setPostOwnerUsername(newProfile.username);
          }
          if (newProfile.full_name !== undefined) {
            setPostOwnerFullName(newProfile.full_name);
          }
        },
      )
      .subscribe();

    myProfileSubscription.current = mySub;
    postOwnerSubscription.current = ownerSub;

    return () => {
      if (myProfileSubscription.current) {
        myProfileSubscription.current.unsubscribe();
      }
      if (postOwnerSubscription.current) {
        postOwnerSubscription.current.unsubscribe();
      }
    };
  }, [visible, profile?.id, post.user_id]);

  const handleQuote = async () => {
    if (!quoteText.trim()) {
      return;
    }

    setLoading(true);
    await onQuote(quoteText);
    setLoading(false);
    setQuoteText("");
    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Alıntıla"
      height={SCREEN_HEIGHT * 0.9}
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { padding: scale(16) }]}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {/* Kullanıcı bilgisi - Bizim profilimiz */}
          <View style={[styles.userInfo, { marginBottom: scale(16) }]}>
            <View
              style={[
                styles.avatar,
                {
                  width: scale(40),
                  height: scale(40),
                  borderRadius: scale(20),
                  backgroundColor: colors.primary + "20",
                  marginRight: scale(12),
                  overflow: "hidden",
                },
              ]}
            >
              <Image
                source={getAvatarSource(myAvatarIndex)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <CustomText
              style={{
                // DÜZELTME: Masaüstünde yazı boyutu küçültüldü
                fontSize: scale(isDesktop ? 10 : 16),
                color: colors.text,
              }}
            >
              {myUsername}
            </CustomText>
          </View>

          {/* Yorum alanı - Bizim yazımız */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                // DÜZELTME: Masaüstünde TextInput yazı boyutu küçültüldü
                fontSize: scale(isDesktop ? 10 : 16),
                padding: scale(16),
                borderRadius: scale(12),
                minHeight: scale(120),
                textAlignVertical: "top",
                marginBottom: scale(16),
              },
            ]}
            placeholder="Bir yorum ekleyin..."
            placeholderTextColor={colors.text + "80"}
            value={quoteText}
            onChangeText={setQuoteText}
            multiline
            autoFocus
          />

          {/* Alıntılanan gönderi - Orijinal gönderi sahibi bilgileriyle */}
          <View
            style={[
              styles.quotedPost,
              {
                backgroundColor: colors.card + "80",
                borderRadius: scale(12),
                padding: scale(12),
                marginBottom: scale(16),
                borderWidth: 1,
                borderColor: colors.text + "20",
              },
            ]}
          >
            {/* Orijinal gönderi sahibi */}
            <View style={[styles.quotedUserInfo, { marginBottom: scale(12) }]}>
              <View
                style={[
                  styles.quotedAvatar,
                  {
                    width: scale(30),
                    height: scale(30),
                    borderRadius: scale(15),
                    backgroundColor: colors.primary + "20",
                    marginRight: scale(8),
                    overflow: "hidden",
                  },
                ]}
              >
                <Image
                  source={getAvatarSource(postOwnerAvatarIndex)}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText
                  style={{
                    // DÜZELTME: Masaüstünde alıntılanan kişinin ismi küçültüldü
                    fontSize: scale(isDesktop ? 10 : 14),
                    color: colors.text,
                  }}
                >
                  {postOwnerUsername}
                </CustomText>
                {postOwnerFullName && (
                  <CustomText
                    style={{ fontSize: scale(12), color: colors.text + "80" }}
                  >
                    {postOwnerFullName}
                  </CustomText>
                )}
              </View>
            </View>

            {/* Gönderi içeriği - Varsa metin içeriği (text tipinde) */}
            {post.content && post.post_type === "text" && (
              <View
                style={[
                  styles.quotedTextContainer,
                  { marginBottom: scale(12) },
                ]}
              >
                <CustomText
                  style={{ fontSize: scale(14), color: colors.text + "CC" }}
                >
                  {post.content}
                </CustomText>
              </View>
            )}

            {/* Varsa görsel */}
            {post.image_url && (
              <View
                style={[
                  styles.quotedImageContainer,
                  { marginBottom: scale(12) },
                ]}
              >
                <Image
                  source={{ uri: post.image_url }}
                  style={[
                    styles.quotedImage,
                    {
                      width: "100%",
                      height: undefined,
                      aspectRatio: 1,
                      borderRadius: scale(8),
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Varsa açıklama metni (görsel/video altı) */}
            {post.content && post.post_type !== "text" && (
              <View style={[styles.quotedCaption, { marginBottom: scale(8) }]}>
                <CustomText
                  style={{ fontSize: scale(14), color: colors.text + "CC" }}
                >
                  {post.content}
                </CustomText>
              </View>
            )}

            {/* Varsa video veya anket için placeholder */}
            {post.post_type === "video" && !post.image_url && (
              <View
                style={[
                  styles.quotedMediaPlaceholder,
                  {
                    marginBottom: scale(12),
                    padding: scale(20),
                    backgroundColor: colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Ionicons
                  name="videocam"
                  size={scale(24)}
                  color={colors.text + "40"}
                />
                <CustomText
                  style={{
                    fontSize: scale(12),
                    color: colors.text + "40",
                    marginTop: scale(4),
                  }}
                >
                  Video
                </CustomText>
              </View>
            )}

            {post.post_type === "poll" && (
              <View
                style={[
                  styles.quotedMediaPlaceholder,
                  {
                    marginBottom: scale(12),
                    padding: scale(20),
                    backgroundColor: colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Ionicons
                  name="bar-chart"
                  size={scale(24)}
                  color={colors.text + "40"}
                />
                <CustomText
                  style={{
                    fontSize: scale(12),
                    color: colors.text + "40",
                    marginTop: scale(4),
                  }}
                >
                  Anket
                </CustomText>
              </View>
            )}
          </View>

          {/* Alıntıla butonu */}
          <TouchableOpacity
            style={[
              styles.quoteButton,
              {
                backgroundColor: colors.primary,
                padding: scale(16),
                borderRadius: scale(12),
                marginBottom: scale(20),
                opacity: loading || !quoteText.trim() ? 0.5 : 1,
              },
            ]}
            onPress={handleQuote}
            disabled={loading || !quoteText.trim()}
          >
            <CustomText
              style={{
                fontSize: scale(18),
                color: "white",
                textAlign: "center",
              }}
            >
              {loading ? "Alıntılanıyor..." : "Alıntıla"}
            </CustomText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  input: {
    borderWidth: 0,
  },
  quotedPost: {
    overflow: "hidden",
  },
  quotedUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  quotedAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  quotedTextContainer: {
    paddingHorizontal: 4,
  },
  quotedImageContainer: {
    width: "100%",
    overflow: "hidden",
  },
  quotedImage: {
    width: "100%",
  },
  quotedMediaPlaceholder: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  quotedCaption: {
    paddingHorizontal: 4,
  },
  quoteButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
