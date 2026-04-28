import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { router } from "expo-router";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export default function VerifyEmailScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const { scale, wp } = useResponsive();

  const handleResendEmail = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) throw error;
      Alert.alert("Başarılı", "Doğrulama e-postası tekrar gönderildi.");
    } catch (error: any) {
      Alert.alert("Hata", error.message);
    }
  };

  const handleCheckVerification = async () => {
    try {
      // Kullanıcıyı yenile
      const {
        data: { user: refreshedUser },
        error,
      } = await supabase.auth.refreshSession();

      if (error) throw error;

      if (refreshedUser?.email_confirmed_at) {
        Alert.alert(
          "Başarılı",
          "E-postanız doğrulandı! Ana sayfaya yönlendiriliyorsunuz.",
        );
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Bilgi",
          "Henüz doğrulamadınız. Lütfen e-postanızı kontrol edin.",
        );
      }
    } catch (error: any) {
      Alert.alert("Hata", error.message);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, padding: scale(20) },
      ]}
    >
      <View
        style={[
          styles.content,
          { maxWidth: 500, alignSelf: "center", width: wp(90) },
        ]}
      >
        <View style={[styles.iconContainer, { marginBottom: scale(30) }]}>
          <Ionicons
            name="mail-outline"
            size={scale(80)}
            color={colors.primary}
          />
        </View>

        <CustomText
          style={[
            {
              fontSize: scale(28),
              color: colors.primary,
              marginBottom: scale(20),
              textAlign: "center",
            },
          ]}
        >
          📧 E-posta Doğrulama
        </CustomText>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card + "DD",
              padding: scale(20),
              borderRadius: scale(15),
              marginBottom: scale(30),
            },
          ]}
        >
          <CustomText
            style={[
              styles.message,
              {
                fontSize: scale(16),
                color: colors.text,
                marginBottom: scale(15),
                lineHeight: scale(24),
              },
            ]}
          >
            <CustomText style={{ color: colors.primary }}>
              {user?.email}
            </CustomText>{" "}
            adresine doğrulama bağlantısı gönderdik.
          </CustomText>
          <CustomText
            style={[
              styles.instruction,
              {
                fontSize: scale(14),
                color: colors.text,
                lineHeight: scale(22),
              },
            ]}
          >
            Lütfen e-postanızı kontrol edin ve doğrulama bağlantısına tıklayın.
          </CustomText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                padding: scale(16),
                borderRadius: scale(10),
                marginBottom: scale(12),
              },
            ]}
            onPress={handleResendEmail}
          >
            <CustomText
              style={[styles.primaryButtonText, { fontSize: scale(18) }]}
            >
              E-postayı Tekrar Gönder
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.card,
                padding: scale(16),
                borderRadius: scale(10),
                marginBottom: scale(12),
              },
            ]}
            onPress={handleCheckVerification}
          >
            <CustomText
              style={[
                styles.secondaryButtonText,
                { fontSize: scale(18), color: colors.primary },
              ]}
            >
              Doğruladım, Devam Et
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkButton, { padding: scale(16) }]}
            onPress={() => signOut()}
          >
            <CustomText
              style={[
                styles.linkButtonText,
                { fontSize: scale(16), color: colors.text },
              ]}
            >
              Farklı Hesap Kullan
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    width: "100%",
  },
  iconContainer: {
    alignItems: "center",
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    textAlign: "center",
  },
  instruction: {
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
  },
  linkButtonText: {},
});
