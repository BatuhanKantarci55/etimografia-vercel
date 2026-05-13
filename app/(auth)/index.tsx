import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import KVKKModal from "@components/Login/kvkk";
import PrivacyModal from "@components/Login/privacy";
import TermsModal from "@components/Login/terms";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface FloatingLabelInputProps extends Omit<TextInputProps, "keyboardType"> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  containerStyle?: any;
  inputStyle?: any;
  themeColors?: any;
  inputRef?: React.Ref<TextInput>;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  containerStyle,
  inputStyle,
  themeColors,
  inputRef,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedIsFocused, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedIsFocused, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const labelStyle = {
    position: "absolute" as const,
    left: 12,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [17, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 11],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [themeColors?.text + "80", themeColors?.primary || "#666"],
    }),
    backgroundColor: themeColors?.card,
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={[{ marginBottom: 16, position: "relative" }, containerStyle]}>
      {/* pointerEvents="none" eklenerek tıklamaların TextInput'a geçmesi sağlandı */}
      <Animated.Text pointerEvents="none" style={labelStyle}>
        {label}
      </Animated.Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          ref={inputRef}
          style={[
            {
              flex: 1,
              height: 50,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 0,
              fontSize: 14,
              textAlignVertical: "center",
            },
            inputStyle,
            Platform.OS === "web" && ({ outlineStyle: "none" } as any),
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: 12 }}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={themeColors?.text + "80"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

type AuthMode = "login" | "register" | "forgot";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [acceptedAgreements, setAcceptedAgreements] = useState(false);
  const [modals, setModals] = useState({
    terms: false,
    privacy: false,
    kvkk: false,
  });

  const passwordRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const registerPasswordRef = useRef<TextInput>(null);

  const { signUp, signIn, resetPassword } = useAuth();
  const { colors } = useTheme();
  const { scale, wp, isLandscape, isTablet, isDesktop, fontSize, spacing } =
    useResponsive();

  const isCompactHorizontal = isLandscape && !isDesktop && !isTablet;

  const getScrollViewStyle = (): ViewStyle => {
    if (isCompactHorizontal) {
      return {
        flexGrow: 1,
        justifyContent: "center",
        paddingVertical: spacing(5),
        paddingHorizontal: spacing(10),
      };
    }
    if (isDesktop) {
      return {
        flexGrow: 1,
        justifyContent: "center",
        paddingVertical: spacing(10),
        paddingHorizontal: spacing(20),
      };
    }
    return { flexGrow: 1, justifyContent: "center", padding: spacing(20) };
  };

  const getFormWidth = () => {
    if (isDesktop) return 400;
    if (isTablet) return isLandscape ? wp(35) : wp(50);
    return isLandscape ? wp(45) : wp(90);
  };

  const getFormPadding = () => {
    if (isDesktop) return 20;
    if (isCompactHorizontal) return spacing(20);
    if (isTablet && isLandscape) return spacing(12);
    return spacing(20);
  };

  const getInputHeight = () => {
    if (isDesktop) return 35;
    if (isCompactHorizontal) return 28;
    if (isTablet && isLandscape) return 36;
    return 45;
  };

  const getButtonTextColor = () => "#FFFFFF";

  const getTitleFontSize = () => {
    if (isDesktop) return 24;
    if (isCompactHorizontal) return 18;
    if (isTablet && isLandscape) return 26;
    return 34;
  };

  const getSubtitleFontSize = () => {
    if (isDesktop) return 11;
    if (isCompactHorizontal) return 10;
    if (isTablet && isLandscape) return 12;
    return 16;
  };

  const getHeaderMarginBottom = () => {
    if (isDesktop) return 20;
    if (isCompactHorizontal) return spacing(4);
    if (isTablet && isLandscape) return spacing(12);
    return spacing(30);
  };

  const getInputFontSize = () => {
    if (isDesktop) return 10;
    if (isCompactHorizontal) return 10;
    if (isTablet && isLandscape) return 12;
    return 14;
  };

  const getButtonFontSize = () => {
    if (isDesktop) return 10;
    if (isCompactHorizontal) return 11;
    if (isTablet && isLandscape) return 13;
    return 16;
  };

  const getLinkFontSize = () => {
    if (isDesktop) return 8;
    if (isCompactHorizontal) return 9;
    if (isTablet && isLandscape) return 11;
    return 13;
  };

  const getInputMarginBottom = () => {
    if (isDesktop) return 12;
    if (isCompactHorizontal) return spacing(6);
    if (isTablet && isLandscape) return spacing(10);
    return spacing(16);
  };

  const getButtonPadding = () => {
    if (isDesktop) return 10;
    if (isCompactHorizontal) return spacing(5);
    if (isTablet && isLandscape) return spacing(8);
    return spacing(14);
  };

  const getFormBorderRadius = () => {
    if (isDesktop) return 10;
    if (isCompactHorizontal) return 8;
    return 12;
  };

  const getTitleMarginBottom = () => {
    if (isDesktop) return 4;
    if (isCompactHorizontal) return spacing(1);
    return spacing(8);
  };

  const handleSubmit = async () => {
    setLoginError(false);

    if (mode === "login") {
      if (!email || !password) {
        Alert.alert("Hata", "Lütfen e-posta ve şifre girin");
        return;
      }
      setLoading(true);
      const { error } = await signIn(email, password);
      setLoading(false);

      if (error) {
        setLoginError(true);
      }
    } else if (mode === "register") {
      if (!email || !username || !password) {
        Alert.alert("Hata", "Lütfen tüm alanları doldurun");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır");
        return;
      }
      if (!acceptedAgreements) {
        Alert.alert(
          "Hata",
          "Kayıt olabilmek için kullanıcı sözleşmesi ve gizlilik politikasını onaylamanız gerekmektedir.",
        );
        return;
      }

      setLoading(true);
      const { error } = await signUp(email, password, username);
      setLoading(false);
      if (error) Alert.alert("Kayıt Başarısız", error.message);
    } else if (mode === "forgot") {
      if (!email) {
        Alert.alert("Hata", "Lütfen e-posta adresinizi girin");
        return;
      }
      setLoading(true);
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        Alert.alert("Hata", error.message);
      } else {
        Alert.alert(
          "Başarılı",
          "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
          [{ text: "Tamam", onPress: () => setMode("login") }],
        );
      }
    }
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLoginError(false);
  };

  const renderForm = () => {
    if (mode === "login") {
      return (
        <>
          {loginError && (
            <CustomText
              style={{
                color: "#FF3B30",
                fontSize: fontSize(getInputFontSize() - 1),
                marginBottom: spacing(8),
                alignSelf: "flex-start",
                fontWeight: "500",
              }}
            >
              Girdiğiniz giriş bilgileri yanlış.
            </CustomText>
          )}
          <FloatingLabelInput
            label="E-posta veya Kullanıcı Adı"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (loginError) setLoginError(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            containerStyle={{ marginBottom: getInputMarginBottom() }}
            inputStyle={{
              backgroundColor: colors.card,
              borderColor: loginError ? "#FF3B30" : colors.border || "#e0e0e0",
              color: colors.text,
              height: scale(getInputHeight()),
              fontSize: fontSize(getInputFontSize()),
              borderRadius: scale(getFormBorderRadius()),
            }}
            themeColors={colors}
          />
          <FloatingLabelInput
            label="Şifre"
            inputRef={passwordRef}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (loginError) setLoginError(false);
            }}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            containerStyle={{ marginBottom: getInputMarginBottom() }}
            inputStyle={{
              backgroundColor: colors.card,
              borderColor: loginError ? "#FF3B30" : colors.border || "#e0e0e0",
              color: colors.text,
              height: scale(getInputHeight()),
              fontSize: fontSize(getInputFontSize()),
              borderRadius: scale(getFormBorderRadius()),
            }}
            themeColors={colors}
          />
          <TouchableOpacity onPress={() => changeMode("forgot")}>
            <CustomText
              style={[
                styles.link,
                {
                  fontSize: fontSize(getLinkFontSize()),
                  color: colors.primary,
                  textAlign: "right",
                  marginBottom: getInputMarginBottom(),
                },
              ]}
            >
              Şifremi unuttum
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                padding: getButtonPadding(),
                borderRadius: scale(getFormBorderRadius()),
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <CustomText
              style={[
                styles.buttonText,
                {
                  fontSize: fontSize(getButtonFontSize()),
                  color: getButtonTextColor(),
                  fontWeight: "700",
                },
              ]}
            >
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => changeMode("register")}
            style={{ marginTop: getInputMarginBottom() }}
          >
            <CustomText
              style={[
                styles.switchText,
                {
                  fontSize: fontSize(getLinkFontSize()),
                  color: colors.text,
                  textAlign: "center",
                },
              ]}
            >
              Hesabınız yok mu?{" "}
              <CustomText style={{ color: colors.primary, fontWeight: "600" }}>
                Kayıt Olun
              </CustomText>
            </CustomText>
          </TouchableOpacity>
        </>
      );
    }

    if (mode === "register") {
      return (
        <>
          <FloatingLabelInput
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
            blurOnSubmit={false}
            containerStyle={{ marginBottom: getInputMarginBottom() }}
            inputStyle={{
              backgroundColor: colors.card,
              borderColor: colors.border || "#e0e0e0",
              color: colors.text,
              height: scale(getInputHeight()),
              fontSize: fontSize(getInputFontSize()),
              borderRadius: scale(getFormBorderRadius()),
            }}
            themeColors={colors}
          />
          <FloatingLabelInput
            label="Kullanıcı Adı"
            inputRef={usernameRef}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => registerPasswordRef.current?.focus()}
            blurOnSubmit={false}
            containerStyle={{ marginBottom: getInputMarginBottom() }}
            inputStyle={{
              backgroundColor: colors.card,
              borderColor: colors.border || "#e0e0e0",
              color: colors.text,
              height: scale(getInputHeight()),
              fontSize: fontSize(getInputFontSize()),
              borderRadius: scale(getFormBorderRadius()),
            }}
            themeColors={colors}
          />
          <FloatingLabelInput
            label="Şifre"
            inputRef={registerPasswordRef}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            containerStyle={{ marginBottom: getInputMarginBottom() }}
            inputStyle={{
              backgroundColor: colors.card,
              borderColor: colors.border || "#e0e0e0",
              color: colors.text,
              height: scale(getInputHeight()),
              fontSize: fontSize(getInputFontSize()),
              borderRadius: scale(getFormBorderRadius()),
            }}
            themeColors={colors}
          />

          <View
            style={[
              styles.checkboxRow,
              { marginBottom: getInputMarginBottom() },
            ]}
          >
            <TouchableOpacity
              onPress={() => setAcceptedAgreements(!acceptedAgreements)}
              style={styles.checkboxTouch}
            >
              <Ionicons
                name={acceptedAgreements ? "checkbox" : "square-outline"}
                size={scale(isDesktop ? 12 : 16)}
                color={acceptedAgreements ? colors.primary : colors.text + "80"}
              />
            </TouchableOpacity>
            <CustomText
              style={{
                color: colors.text,
                fontSize: scale(isDesktop ? 9 : 11),
                flex: 1,
                lineHeight: scale(isDesktop ? 12 : 16),
              }}
            >
              <CustomText
                onPress={() => setModals({ ...modals, terms: true })}
                style={[
                  styles.checkboxLink,
                  {
                    color: colors.primary,
                    fontSize: scale(isDesktop ? 9 : 11),
                  },
                ]}
              >
                Kullanıcı Sözleşmesini
              </CustomText>
              {" ve "}
              <CustomText
                onPress={() => setModals({ ...modals, privacy: true })}
                style={[
                  styles.checkboxLink,
                  {
                    color: colors.primary,
                    fontSize: scale(isDesktop ? 9 : 11),
                  },
                ]}
              >
                Gizlilik Politikasını
              </CustomText>
              {" okudum ve kabul ediyorum."}
            </CustomText>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                padding: getButtonPadding(),
                borderRadius: scale(getFormBorderRadius()),
              },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <CustomText
              style={[
                styles.buttonText,
                {
                  fontSize: fontSize(getButtonFontSize()),
                  color: getButtonTextColor(),
                  fontWeight: "700",
                },
              ]}
            >
              {loading ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => changeMode("login")}
            style={{ marginTop: getInputMarginBottom() }}
          >
            <CustomText
              style={[
                styles.switchText,
                {
                  fontSize: fontSize(getLinkFontSize()),
                  color: colors.text,
                  textAlign: "center",
                },
              ]}
            >
              Zaten hesabınız var mı?{" "}
              <CustomText style={{ color: colors.primary, fontWeight: "600" }}>
                Giriş Yapın
              </CustomText>
            </CustomText>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <CustomText
          style={[
            styles.description,
            {
              fontSize: fontSize(getLinkFontSize()),
              color: colors.text,
              marginBottom: getInputMarginBottom(),
              lineHeight: spacing(isDesktop ? 16 : 20),
              textAlign: "center",
            },
          ]}
        >
          E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
        </CustomText>
        <FloatingLabelInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          containerStyle={{ marginBottom: getInputMarginBottom() }}
          inputStyle={{
            backgroundColor: colors.card,
            borderColor: colors.border || "#e0e0e0",
            color: colors.text,
            height: scale(getInputHeight()),
            fontSize: fontSize(getInputFontSize()),
            borderRadius: scale(getFormBorderRadius()),
          }}
          themeColors={colors}
        />
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              padding: getButtonPadding(),
              borderRadius: scale(getFormBorderRadius()),
            },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <CustomText
            style={[
              styles.buttonText,
              {
                fontSize: fontSize(getButtonFontSize()),
                color: getButtonTextColor(),
                fontWeight: "700",
              },
            ]}
          >
            {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Gönder"}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => changeMode("login")}
          style={{ marginTop: getInputMarginBottom() }}
        >
          <CustomText
            style={[
              styles.switchText,
              {
                fontSize: fontSize(getLinkFontSize()),
                color: colors.primary,
                textAlign: "center",
                fontWeight: "500",
              },
            ]}
          >
            ← Giriş Sayfasına Dön
          </CustomText>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <BackgroundImage overlayOpacity={0.05}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={getScrollViewStyle()}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={[styles.header, { marginBottom: getHeaderMarginBottom() }]}
          >
            <CustomText
              style={[
                {
                  fontSize: fontSize(getTitleFontSize()),
                  color: colors.primary,
                  marginBottom: getTitleMarginBottom(),
                  fontWeight: "bold",
                },
              ]}
            >
              Etimografia
            </CustomText>
            <CustomText
              style={[
                styles.subtitle,
                {
                  fontSize: fontSize(getSubtitleFontSize()),
                  color: colors.text,
                  textAlign: "center",
                },
              ]}
            >
              {mode === "login" && "Hesabınıza giriş yapın"}
              {mode === "register" && "Yeni hesap oluşturun"}
              {mode === "forgot" && "Şifrenizi sıfırlayın"}
            </CustomText>
          </View>
          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: colors.card,
                padding: getFormPadding(),
                borderRadius: scale(getFormBorderRadius()),
                width: getFormWidth(),
                maxWidth: isDesktop ? 400 : isTablet ? 450 : 350,
                alignSelf: "center",
                ...(isDesktop && {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 4,
                }),
              },
            ]}
          >
            {renderForm()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TermsModal
        visible={modals.terms}
        onClose={() => setModals({ ...modals, terms: false })}
      />
      <PrivacyModal
        visible={modals.privacy}
        onClose={() => setModals({ ...modals, privacy: false })}
      />
      <KVKKModal
        visible={modals.kvkk}
        onClose={() => setModals({ ...modals, kvkk: false })}
      />
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center" },
  subtitle: { textAlign: "center" },
  formContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  button: { alignItems: "center" },
  buttonText: { fontWeight: "600" },
  link: { textAlign: "right" },
  switchText: { textAlign: "center" },
  description: { textAlign: "center" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxTouch: {
    padding: 2,
    marginRight: 4,
  },
  checkboxLink: {
    fontWeight: "600",
  },
});
