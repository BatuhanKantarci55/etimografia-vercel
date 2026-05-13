import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function VerifyEmailScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { scale, wp, isDesktop } = useResponsive();

  return (
    <BackgroundImage overlayOpacity={0.03}>
      <View style={[styles.container, { padding: scale(isDesktop ? 10 : 20) }]}>
        <View
          style={[
            styles.content,
            {
              maxWidth: isDesktop ? 400 : 500,
              alignSelf: "center",
              width: wp(90),
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { marginBottom: scale(isDesktop ? 15 : 30) },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={scale(isDesktop ? 50 : 80)}
              color={colors.primary}
            />
          </View>

          <CustomText
            style={[
              {
                fontSize: scale(isDesktop ? 20 : 28),
                color: colors.primary,
                marginBottom: scale(isDesktop ? 10 : 20),
                textAlign: "center",
                fontWeight: "bold",
              },
            ]}
          >
            📧 E-posta Doğrulama
          </CustomText>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card + "EE",
                padding: scale(isDesktop ? 16 : 20),
                borderRadius: scale(isDesktop ? 10 : 15),
                marginBottom: scale(isDesktop ? 15 : 30),
              },
            ]}
          >
            <CustomText
              style={[
                styles.message,
                {
                  fontSize: scale(isDesktop ? 13 : 16),
                  color: colors.text,
                  marginBottom: scale(isDesktop ? 8 : 15),
                  lineHeight: scale(isDesktop ? 20 : 24),
                },
              ]}
            >
              <CustomText style={{ color: colors.primary, fontWeight: "600" }}>
                {user?.email}
              </CustomText>{" "}
              adresine doğrulama bağlantısı gönderdik.
            </CustomText>
            <CustomText
              style={[
                styles.instruction,
                {
                  fontSize: scale(isDesktop ? 11 : 14),
                  color: colors.text,
                  lineHeight: scale(isDesktop ? 16 : 22),
                },
              ]}
            >
              Lütfen e-postanızı kontrol edin ve doğrulama bağlantısına
              tıklayın.
            </CustomText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  padding: scale(isDesktop ? 10 : 16),
                  borderRadius: scale(isDesktop ? 8 : 10),
                  marginBottom: scale(isDesktop ? 8 : 12),
                },
              ]}
              onPress={() => router.replace("/(tabs)")}
            >
              <CustomText
                style={[
                  styles.primaryButtonText,
                  { fontSize: scale(isDesktop ? 14 : 18) },
                ]}
              >
                Ana Sayfaya Dön
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BackgroundImage>
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
});
