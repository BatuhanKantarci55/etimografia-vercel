import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { useState } from "react";
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
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Kullanıcı adı validasyonu
  const validateUsername = (value: string) => {
    // Sadece harf, rakam ve alt çizgi
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (value.length < 3) {
      return "Kullanıcı adı en az 3 karakter olmalıdır";
    }
    if (value.length > 20) {
      return "Kullanıcı adı en fazla 20 karakter olmalıdır";
    }
    if (!usernameRegex.test(value)) {
      return "Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir";
    }
    return "";
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleSave = async () => {
    // Validasyonları kontrol et
    const error = validateUsername(username);
    if (error) {
      Alert.alert("Hata", error);
      return;
    }

    if (!fullName.trim()) {
      Alert.alert("Hata", "Ad soyad boş bırakılamaz");
      return;
    }

    setLoading(true);

    const { error: updateError } = await updateProfile({
      full_name: fullName.trim(),
      username: username.trim(),
      bio: bio.trim(),
    });

    setLoading(false);

    if (updateError) {
      Alert.alert("Hata", "Profil güncellenirken bir hata oluştu");
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
      // DEĞİŞİKLİK: Masaüstü için düzenleme kutusunun genişliği daha da daraltıldı
      desktopWidth={scale(350)}
    >
      <ScrollView
        // DEĞİŞİKLİK: flex: 1 yerine flexShrink: 1 kullanılarak kaydırma (scroll) sorunu çözüldü
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
                // DEĞİŞİKLİK: Masaüstü için metinler küçültüldü
                fontSize: scale(isDesktop ? 12 : 14),
                color: colors.text,
                marginBottom: scale(isDesktop ? 6 : 8),
              },
            ]}
          >
            Ad Soyad
          </CustomText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                // DEĞİŞİKLİK: Masaüstü için girdi metinleri ve boşluklar küçültüldü
                fontSize: scale(isDesktop ? 13 : 16),
                padding: scale(isDesktop ? 12 : 16),
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
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                fontSize: scale(isDesktop ? 13 : 16),
                padding: scale(isDesktop ? 12 : 16),
                borderRadius: scale(12),
                borderWidth: 1,
                borderColor: usernameError
                  ? "#FF3B30"
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
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                fontSize: scale(isDesktop ? 13 : 16),
                padding: scale(isDesktop ? 12 : 16),
                borderRadius: scale(12),
                // DEĞİŞİKLİK: Masaüstünde bio kutusunun yüksekliği azaltıldı
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
          />
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
              // DEĞİŞİKLİK: Masaüstü için padding değerleri küçültüldü
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
              // DEĞİŞİKLİK: Yazı boyutu küçültüldü
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
  container: {
    flexGrow: 1,
  },
  inputContainer: {
    width: "100%",
  },
  label: {
    fontWeight: "500",
  },
  input: {
    borderWidth: 0,
  },
  errorText: {
    fontWeight: "500",
  },
  charCount: {
    fontWeight: "400",
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
