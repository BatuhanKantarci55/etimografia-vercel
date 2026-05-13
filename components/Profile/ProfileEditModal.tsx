import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({
  visible,
  onClose,
}: ProfileEditModalProps) {
  const { profile, updateProfile } = useAuth();
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (visible && profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setUsernameError("");
    }
  }, [visible, profile]);

  const validateUsername = (value: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (value.length < 3) return "Kullanıcı adı en az 3 karakter olmalıdır";
    if (value.length > 20)
      return "Kullanıcı adı en fazla 20 karakter olmalıdır";
    if (!usernameRegex.test(value))
      return "Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir";
    return "";
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value !== profile?.username) {
      setUsernameError(validateUsername(value));
    } else {
      setUsernameError("");
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    // Sadece değişen alanları içeren bir obje oluşturalım
    const updates: any = {};
    let hasChanges = false;

    // 1. Kullanıcı Adı Kontrolü
    const finalUsername = username.trim();
    if (finalUsername !== (profile.username || "")) {
      const error = validateUsername(finalUsername);
      if (error) {
        Alert.alert("Hata", error);
        return;
      }
      updates.username = finalUsername;
      hasChanges = true;
    }

    // 2. Ad Soyad Kontrolü
    const finalFullName = fullName.trim();
    if (finalFullName !== (profile.full_name || "")) {
      if (!finalFullName) {
        Alert.alert("Hata", "Ad soyad boş bırakılamaz");
        return;
      }
      updates.full_name = finalFullName;
      hasChanges = true;
    }

    // 3. Biyografi Kontrolü
    const finalBio = bio.trim();
    if (finalBio !== (profile.bio || "")) {
      updates.bio = finalBio;
      hasChanges = true;
    }

    // Değişiklik yoksa boşuna istek atma
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);

    // updateProfile fonksiyonuna sadece değişen 'updates' objesini gönderiyoruz
    const { error: updateError } = await updateProfile(updates);

    setLoading(false);

    if (updateError) {
      // Eğer hata kullanıcı adının alınmış olmasından kaynaklıysa (Supabase unique constraint)
      if (
        updateError.message?.includes("unique") ||
        updateError.code === "23505"
      ) {
        Alert.alert("Hata", "Bu kullanıcı adı zaten alınmış");
      } else {
        Alert.alert("Hata", "Profil güncellenirken bir hata oluştu");
      }
    } else {
      Alert.alert("Başarılı", "Profil bilgileriniz güncellendi");
      onClose();
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Profili Düzenle"
      height="70%"
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
      desktopWidth={scale(350)}
    >
      <ScrollView
        style={{ flexShrink: 1, width: "100%" }}
        contentContainerStyle={[
          styles.container,
          { padding: scale(isDesktop ? 16 : 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ad Soyad */}
        <View
          style={[
            styles.inputContainer,
            { marginBottom: scale(isDesktop ? 16 : 20) },
          ]}
        >
          <CustomText
            style={[
              styles.label,
              {
                fontSize: scale(isDesktop ? 12 : 14),
                color: colors.text,
                marginBottom: scale(isDesktop ? 6 : 8),
              },
            ]}
          >
            Ad Soyad
          </CustomText>
          <View style={{ position: "relative", justifyContent: "center" }}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  fontSize: scale(isDesktop ? 13 : 16),
                  padding: scale(isDesktop ? 12 : 16),
                  paddingRight: scale(isDesktop ? 35 : 45),
                  borderRadius: scale(12),
                  borderWidth: 1,
                  borderColor: colors.border || colors.text + "20",
                },
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Adınız ve soyadınız"
              placeholderTextColor={colors.text + "60"}
            />
            {fullName.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFullName("")}
              >
                <Ionicons
                  name="close-circle"
                  size={scale(isDesktop ? 16 : 20)}
                  color={colors.text + "60"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Kullanıcı Adı */}
        <View
          style={[
            styles.inputContainer,
            { marginBottom: scale(isDesktop ? 16 : 20) },
          ]}
        >
          <CustomText
            style={[
              styles.label,
              {
                fontSize: scale(isDesktop ? 12 : 14),
                color: colors.text,
                marginBottom: scale(isDesktop ? 6 : 8),
              },
            ]}
          >
            Kullanıcı Adı
          </CustomText>
          <View style={{ position: "relative", justifyContent: "center" }}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  fontSize: scale(isDesktop ? 13 : 16),
                  padding: scale(isDesktop ? 12 : 16),
                  paddingRight: scale(isDesktop ? 35 : 45),
                  borderRadius: scale(12),
                  borderWidth: 1,
                  borderColor: usernameError
                    ? "#FF3B30"
                    : username !== profile?.username
                      ? colors.primary
                      : colors.border || colors.text + "20",
                },
              ]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="kullanici_adi"
              placeholderTextColor={colors.text + "60"}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {username.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setUsername("");
                  setUsernameError("");
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={scale(isDesktop ? 16 : 20)}
                  color={colors.text + "60"}
                />
              </TouchableOpacity>
            )}
          </View>
          {usernameError ? (
            <CustomText
              style={[
                styles.errorText,
                { fontSize: scale(12), color: "#FF3B30", marginTop: scale(4) },
              ]}
            >
              {usernameError}
            </CustomText>
          ) : null}
        </View>

        {/* Biyografi */}
        <View
          style={[
            styles.inputContainer,
            { marginBottom: scale(isDesktop ? 16 : 20) },
          ]}
        >
          <CustomText
            style={[
              styles.label,
              {
                fontSize: scale(isDesktop ? 12 : 14),
                color: colors.text,
                marginBottom: scale(isDesktop ? 6 : 8),
              },
            ]}
          >
            Biyografi
          </CustomText>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  fontSize: scale(isDesktop ? 13 : 16),
                  padding: scale(isDesktop ? 12 : 16),
                  paddingRight: scale(isDesktop ? 35 : 45),
                  borderRadius: scale(12),
                  minHeight: scale(isDesktop ? 80 : 100),
                  textAlignVertical: "top",
                  borderWidth: 1,
                  borderColor: colors.border || colors.text + "20",
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Kendinizden biraz bahsedin..."
              placeholderTextColor={colors.text + "60"}
              multiline
              maxLength={150}
            />
            {bio.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.clearButton,
                  { top: scale(isDesktop ? 10 : 14), bottom: undefined },
                ]}
                onPress={() => setBio("")}
              >
                <Ionicons
                  name="close-circle"
                  size={scale(isDesktop ? 16 : 20)}
                  color={colors.text + "60"}
                />
              </TouchableOpacity>
            )}
          </View>
          <CustomText
            style={[
              styles.charCount,
              {
                fontSize: scale(12),
                color: colors.text + "60",
                marginTop: scale(4),
                textAlign: "right",
              },
            ]}
          >
            {bio.length}/150
          </CustomText>
        </View>

        {/* Kaydet Butonu */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              padding: scale(isDesktop ? 12 : 16),
              borderRadius: scale(12),
              marginTop: scale(10),
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          <CustomText
            style={{
              fontSize: scale(isDesktop ? 14 : 18),
              color: "white",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  inputContainer: { width: "100%" },
  label: { fontWeight: "500" },
  input: { borderWidth: 0 },
  clearButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 12,
    zIndex: 1,
  },
  errorText: { fontWeight: "500" },
  charCount: { fontWeight: "400" },
  saveButton: { alignItems: "center", justifyContent: "center" },
});
