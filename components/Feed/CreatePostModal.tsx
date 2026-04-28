import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { usePosts } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type PostType = "text" | "image" | "poll";

interface PollOption {
  id: string;
  text: string;
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreatePostModal({
  visible,
  onClose,
}: CreatePostModalProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();
  const { profile } = useAuth();
  const { createPost } = usePosts();

  const [postType, setPostType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Fotoğraf seçmek için galeri izni gerekiyor.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Fotoğraf seçilirken hata:", error);
      Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu");
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, { id: Date.now().toString(), text: "" }]);
    }
  };

  const removePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((opt) => opt.id !== id));
    }
  };

  const updatePollOption = (id: string, text: string) => {
    setPollOptions(
      pollOptions.map((opt) => (opt.id === id ? { ...opt, text } : opt)),
    );
  };

  const handleShare = async () => {
    if (postType === "text" && !content.trim()) {
      Alert.alert("Hata", "Lütfen bir şeyler yazın");
      return;
    }

    if (postType === "image" && !image) {
      Alert.alert("Hata", "Lütfen bir fotoğraf seçin");
      return;
    }

    if (postType === "poll") {
      if (!pollQuestion.trim()) {
        Alert.alert("Hata", "Lütfen anket sorusu yazın");
        return;
      }
      if (pollOptions.some((opt) => !opt.text.trim())) {
        Alert.alert("Hata", "Lütfen tüm anket seçeneklerini doldurun");
        return;
      }
    }

    setLoading(true);

    let postData: any = {
      post_type: postType,
    };

    if (postType === "text") {
      postData.content = content.trim();
    } else if (postType === "image") {
      postData.content = content.trim() || "";
      postData.image_url = image;
    } else if (postType === "poll") {
      postData.content = pollQuestion.trim();
      postData.poll_data = {
        question: pollQuestion.trim(),
        options: pollOptions.map((opt, index) => ({
          id: index + 1,
          text: opt.text.trim(),
          votes: 0,
        })),
      };
    }

    const { error } = await createPost(postData);
    setLoading(false);

    if (error) {
      Alert.alert(
        "Hata",
        "Gönderi paylaşılamadı: " + (error.message || "Bilinmeyen hata"),
      );
    } else {
      Alert.alert("Başarılı", "Gönderiniz paylaşıldı");
      // Formu temizle
      setContent("");
      setImage(null);
      setPollQuestion("");
      setPollOptions([
        { id: "1", text: "" },
        { id: "2", text: "" },
      ]);
      setPostType("text");
      onClose();
    }
  };

  const renderPostTypeSelector = () => (
    <View
      style={[styles.typeSelector, { marginBottom: scale(isDesktop ? 8 : 20) }]}
    >
      <TouchableOpacity
        style={[
          styles.typeButton,
          {
            backgroundColor:
              postType === "text" ? colors.primary + "20" : "transparent",
            padding: scale(isDesktop ? 4 : 10),
            borderRadius: scale(isDesktop ? 6 : 10),
            marginRight: scale(isDesktop ? 4 : 10),
          },
        ]}
        onPress={() => setPostType("text")}
      >
        <Ionicons
          name="text"
          size={scale(isDesktop ? 14 : 24)}
          color={postType === "text" ? colors.primary : colors.text + "80"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeButton,
          {
            backgroundColor:
              postType === "image" ? colors.primary + "20" : "transparent",
            padding: scale(isDesktop ? 4 : 10),
            borderRadius: scale(isDesktop ? 6 : 10),
            marginRight: scale(isDesktop ? 4 : 10),
          },
        ]}
        onPress={() => setPostType("image")}
      >
        <Ionicons
          name="image"
          size={scale(isDesktop ? 14 : 24)}
          color={postType === "image" ? colors.primary : colors.text + "80"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeButton,
          {
            backgroundColor:
              postType === "poll" ? colors.primary + "20" : "transparent",
            padding: scale(isDesktop ? 4 : 10),
            borderRadius: scale(isDesktop ? 6 : 10),
          },
        ]}
        onPress={() => setPostType("poll")}
      >
        <Ionicons
          name="bar-chart"
          size={scale(isDesktop ? 14 : 24)}
          color={postType === "poll" ? colors.primary : colors.text + "80"}
        />
      </TouchableOpacity>
    </View>
  );

  const renderTextInput = () => (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          color: colors.text,
          fontSize: scale(isDesktop ? 12 : 16),
          padding: scale(isDesktop ? 10 : 16),
          borderRadius: scale(12),
          minHeight: scale(isDesktop ? 60 : 120),
          textAlignVertical: "top",
        },
      ]}
      placeholder="Ne düşünüyorsunuz?"
      placeholderTextColor={colors.text + "80"}
      value={content}
      onChangeText={setContent}
      multiline
    />
  );

  const renderImageInput = () => (
    <View>
      {image ? (
        <View
          style={[
            styles.imagePreviewContainer,
            { marginBottom: scale(isDesktop ? 6 : 12) },
          ]}
        >
          <Image
            source={{ uri: image }}
            style={[
              styles.imagePreview,
              {
                borderRadius: scale(12),
                height: scale(isDesktop ? 120 : 200),
                width: "100%",
              },
            ]}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[
              styles.removeImage,
              {
                backgroundColor: colors.card,
                top: scale(8),
                right: scale(8),
                width: scale(isDesktop ? 22 : 32),
                height: scale(isDesktop ? 22 : 32),
                borderRadius: scale(isDesktop ? 11 : 16),
              },
            ]}
            onPress={() => setImage(null)}
          >
            <Ionicons
              name="close"
              size={scale(isDesktop ? 14 : 20)}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.imagePicker,
            {
              backgroundColor: colors.card,
              padding: scale(isDesktop ? 12 : 30),
              borderRadius: scale(12),
              alignItems: "center",
            },
          ]}
          onPress={pickImage}
        >
          <Ionicons
            name="image-outline"
            size={scale(isDesktop ? 24 : 48)}
            color={colors.text + "80"}
          />
          <CustomText
            style={{
              color: colors.text + "80",
              marginTop: scale(isDesktop ? 4 : 10),
              fontSize: scale(isDesktop ? 11 : 14),
            }}
          >
            Fotoğraf Seç
          </CustomText>
        </TouchableOpacity>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.text,
            fontSize: scale(isDesktop ? 12 : 16),
            padding: scale(isDesktop ? 10 : 16),
            borderRadius: scale(12),
            marginTop: scale(isDesktop ? 6 : 12),
          },
        ]}
        placeholder="Açıklama ekleyin (isteğe bağlı)"
        placeholderTextColor={colors.text + "80"}
        value={content}
        onChangeText={setContent}
      />
    </View>
  );

  const renderPollInput = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.text,
            fontSize: scale(isDesktop ? 12 : 16),
            padding: scale(isDesktop ? 10 : 16),
            borderRadius: scale(12),
            marginBottom: scale(isDesktop ? 8 : 16),
          },
        ]}
        placeholder="Anket sorusu"
        placeholderTextColor={colors.text + "80"}
        value={pollQuestion}
        onChangeText={setPollQuestion}
      />

      {pollOptions.map((option, index) => (
        <View
          key={option.id}
          style={[
            styles.pollOptionContainer,
            { marginBottom: scale(isDesktop ? 4 : 8) },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                fontSize: scale(isDesktop ? 12 : 16),
                padding: scale(isDesktop ? 10 : 16),
                borderRadius: scale(12),
                flex: 1,
              },
            ]}
            placeholder={`Seçenek ${index + 1}`}
            placeholderTextColor={colors.text + "80"}
            value={option.text}
            onChangeText={(text) => updatePollOption(option.id, text)}
          />
          {pollOptions.length > 2 && (
            <TouchableOpacity
              style={[
                styles.removeOption,
                { marginLeft: scale(isDesktop ? 6 : 8) },
              ]}
              onPress={() => removePollOption(option.id)}
            >
              <Ionicons
                name="close-circle"
                size={scale(isDesktop ? 18 : 24)}
                color={colors.text + "60"}
              />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {pollOptions.length < 4 && (
        <TouchableOpacity
          style={[
            styles.addOption,
            {
              backgroundColor: colors.card,
              padding: scale(isDesktop ? 8 : 12),
              borderRadius: scale(12),
              alignItems: "center",
              marginTop: scale(isDesktop ? 4 : 8),
              flexDirection: "row",
              justifyContent: "center",
            },
          ]}
          onPress={addPollOption}
        >
          <Ionicons
            name="add"
            size={scale(isDesktop ? 16 : 24)}
            color={colors.primary}
          />
          <CustomText
            style={{
              color: colors.primary,
              marginLeft: scale(8),
              fontSize: scale(isDesktop ? 12 : 14),
            }}
          >
            Seçenek Ekle
          </CustomText>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Yeni Gönderi"
      height="80%" // Mobil için geçerli
      desktopWidth={scale(340)} // DEĞİŞİKLİK: Masaüstü görünümü için modalın genişliği daha da daraltıldı
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <View style={[styles.container, { padding: scale(isDesktop ? 12 : 20) }]}>
        {/* Kullanıcı bilgisi */}
        <View
          style={[styles.userInfo, { marginBottom: scale(isDesktop ? 8 : 16) }]}
        >
          <View
            style={[
              styles.avatar,
              {
                width: scale(isDesktop ? 24 : 40),
                height: scale(isDesktop ? 24 : 40),
                borderRadius: scale(isDesktop ? 12 : 20),
                backgroundColor: colors.primary + "20",
                marginRight: scale(isDesktop ? 8 : 12),
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <CustomText
              style={{
                fontSize: scale(isDesktop ? 12 : 18),
                color: colors.primary,
              }}
            >
              {profile?.username?.charAt(0)?.toUpperCase() || "U"}
            </CustomText>
          </View>
          <CustomText
            style={{
              fontSize: scale(isDesktop ? 12 : 16),
              color: colors.text,
              fontWeight: "600",
            }}
          >
            {profile?.username || "Kullanıcı"}
          </CustomText>
        </View>

        {/* Gönderi tipi seçici */}
        {renderPostTypeSelector()}

        {/* Gönderi içeriği */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {postType === "text" && renderTextInput()}
          {postType === "image" && renderImageInput()}
          {postType === "poll" && renderPollInput()}
        </ScrollView>

        {/* Paylaş butonu */}
        <TouchableOpacity
          style={[
            styles.shareButton,
            {
              backgroundColor: colors.primary,
              padding: scale(isDesktop ? 10 : 16),
              borderRadius: scale(12),
              marginTop: scale(isDesktop ? 10 : 20),
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleShare}
          disabled={loading}
        >
          <CustomText
            style={[
              styles.shareButtonText,
              {
                fontSize: scale(isDesktop ? 13 : 18),
                color: "white",
                textAlign: "center",
                fontWeight: "600",
              },
            ]}
          >
            {loading ? "Paylaşılıyor..." : "Paylaş"}
          </CustomText>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  typeSelector: {
    flexDirection: "row",
  },
  typeButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 0,
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
  },
  removeImage: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePicker: {
    justifyContent: "center",
    alignItems: "center",
  },
  pollOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeOption: {
    justifyContent: "center",
    alignItems: "center",
  },
  addOption: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {},
});
