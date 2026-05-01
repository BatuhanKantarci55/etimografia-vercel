import AuthRequiredModal from "@components/AuthRequiredModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import ProfileEditModal from "./ProfileEditModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({
  visible,
  onClose,
}: SettingsDrawerProps) {
  const { user, profile, signOut } = useAuth();
  const { colors, themeMode, toggleTheme, appMode, setAppMode } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const drawerWidth = isDesktop ? scale(240) : SCREEN_WIDTH * 0.85;

  // Animasyon için shared values
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      openDrawer();
    }
  }, [visible]);

  const openDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0, // 0 yapınca tamamen sola gelir
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH, // Tamamen sağa kaybolacak
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true },
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      // Kaydırma miktarına göre kapat veya aç
      if (event.nativeEvent.translationX > 100) {
        closeDrawer();
      } else {
        openDrawer();
      }
    }
  };

  const performSignOut = async () => {
    try {
      await signOut();
      closeDrawer();
      // AuthContext'teki `useEffect` otomatik olarak yönlendirme yapacak
    } catch (error) {
      console.error("Çıkış yapılamadı:", error);
      if (Platform.OS === "web") {
        window.alert("Çıkış yapılırken bir hata oluştu.");
      } else {
        Alert.alert("Hata", "Çıkış yapılırken bir hata oluştu.");
      }
    }
  };

  const handleSignOut = () => {
    // Web için native alert çalışmaz, bu yüzden window.confirm kullanıyoruz
    if (Platform.OS === "web") {
      const isConfirmed = window.confirm(
        "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      );
      if (isConfirmed) {
        performSignOut();
      }
    } else {
      // Mobil cihazlar için native Alert
      Alert.alert(
        "Çıkış Yap",
        "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
        [
          {
            text: "İptal",
            style: "cancel",
          },
          {
            text: "Çıkış Yap",
            style: "destructive",
            onPress: performSignOut,
          },
        ],
      );
    }
  };

  const handleEditProfile = () => {
    closeDrawer(); // Önce drawer'ı kapat
    if (!user) {
      setTimeout(() => {
        setAuthModalVisible(true);
      }, 300);
      return;
    }
    setTimeout(() => {
      setEditProfileVisible(true); // Sonra edit modalını aç
    }, 300);
  };

  const appModes = ["education", "practice", "competition", "event"] as const;

  // Mode isimlerini Türkçeleştir
  const getModeName = (mode: string) => {
    switch (mode) {
      case "education":
        return "Eğitim Modu";
      case "practice":
        return "Alıştırma Modu";
      case "competition":
        return "Müsabaka Modu";
      case "event":
        return "Etkinlik Modu";
      default:
        return mode;
    }
  };

  // Mode ikonlarını belirle
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "education":
        return "school";
      case "practice":
        return "barbell";
      case "competition":
        return "trophy";
      case "event":
        return "calendar";
      default:
        return "apps";
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.overlay,
              { opacity: overlayOpacity, backgroundColor: "black" },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeDrawer}
            />
          </Animated.View>

          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: colors.background,
                  width: drawerWidth,
                  transform: [{ translateX }],
                  position: "absolute",
                  right: 0,
                },
              ]}
            >
              {/* Başlık - Sabit */}
              <View
                style={[styles.header, { padding: scale(isDesktop ? 10 : 20) }]}
              >
                <CustomText
                  style={{
                    fontSize: scale(isDesktop ? 14 : 24),
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  Ayarlar
                </CustomText>
                <TouchableOpacity onPress={closeDrawer}>
                  <Ionicons
                    name="close"
                    size={scale(isDesktop ? 16 : 28)}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              {/* Kaydırılabilir İçerik */}
              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContent}
                style={{ flex: 1 }}
              >
                {/* Kullanıcı Bilgileri */}
                <View
                  style={[
                    styles.userInfo,
                    { padding: scale(isDesktop ? 10 : 20) },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: colors.primary,
                        width: scale(isDesktop ? 32 : 60),
                        height: scale(isDesktop ? 32 : 60),
                        borderRadius: scale(isDesktop ? 16 : 30),
                        marginRight: scale(isDesktop ? 8 : 15),
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <CustomText
                      style={{
                        fontSize: scale(isDesktop ? 14 : 24),
                        color: "white",
                      }}
                    >
                      {user
                        ? profile?.username?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase() ||
                          "U"
                        : "M"}
                    </CustomText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomText
                      style={{
                        fontSize: scale(isDesktop ? 12 : 18),
                        color: colors.text,
                      }}
                    >
                      {user
                        ? profile?.username ||
                          user?.user_metadata?.username ||
                          "Kullanıcı"
                        : "Misafir"}
                    </CustomText>
                    <CustomText
                      style={{
                        fontSize: scale(isDesktop ? 10 : 14),
                        color: colors.text + "80",
                        marginTop: scale(2),
                      }}
                    >
                      {user ? user?.email : "Giriş yapılmadı"}
                    </CustomText>
                  </View>
                </View>

                {/* TEMA VE MOD BÖLÜMÜ */}
                <View
                  style={[
                    styles.menuSection,
                    {
                      paddingHorizontal: scale(isDesktop ? 10 : 20),
                      marginTop: scale(isDesktop ? 6 : 20),
                    },
                  ]}
                >
                  <CustomText
                    style={[
                      styles.sectionTitle,
                      {
                        fontSize: scale(isDesktop ? 9 : 14),
                        color: colors.text + "80",
                        marginBottom: scale(isDesktop ? 4 : 10),
                        fontWeight: "600",
                        letterSpacing: 0.5,
                      },
                    ]}
                  >
                    GÖRÜNÜM VE MOD
                  </CustomText>

                  {/* Tema Değiştir */}
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 4 : 10),
                      },
                    ]}
                    onPress={toggleTheme}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name={themeMode === "light" ? "sunny" : "moon"}
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        {themeMode === "light"
                          ? "Koyu Temaya Geç"
                          : "Açık Temaya Geç"}
                      </CustomText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={scale(isDesktop ? 12 : 20)}
                      color={colors.text + "60"}
                    />
                  </TouchableOpacity>

                  {/* Mod Değiştir */}
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 6 : 15),
                      },
                    ]}
                    onPress={() => {
                      const currentIndex = appModes.indexOf(appMode);
                      const nextIndex = (currentIndex + 1) % appModes.length;
                      setAppMode(appModes[nextIndex]);
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name={getModeIcon(appMode) as any}
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        {getModeName(appMode)}
                      </CustomText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={scale(isDesktop ? 12 : 20)}
                      color={colors.text + "60"}
                    />
                  </TouchableOpacity>
                </View>

                {/* BİLDİRİMLER BÖLÜMÜ */}
                <View
                  style={[
                    styles.menuSection,
                    {
                      paddingHorizontal: scale(isDesktop ? 10 : 20),
                      marginTop: scale(isDesktop ? 6 : 20),
                    },
                  ]}
                >
                  <CustomText
                    style={[
                      styles.sectionTitle,
                      {
                        fontSize: scale(isDesktop ? 9 : 14),
                        color: colors.text + "80",
                        marginBottom: scale(isDesktop ? 4 : 10),
                        fontWeight: "600",
                        letterSpacing: 0.5,
                      },
                    ]}
                  >
                    BİLDİRİMLER
                  </CustomText>

                  {/* Bildirimler Switch */}
                  <View
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 4 : 10),
                      },
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="notifications"
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        Bildirimler
                      </CustomText>
                    </View>
                    <Switch
                      value={notifications}
                      onValueChange={setNotifications}
                      trackColor={{
                        false: colors.text + "40",
                        true: colors.primary,
                      }}
                      thumbColor="white"
                      style={isDesktop ? { transform: [{ scale: 0.55 }] } : {}}
                    />
                  </View>

                  {/* Ses Efektleri Switch */}
                  <View
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 6 : 15),
                      },
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="volume-high"
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        Ses Efektleri
                      </CustomText>
                    </View>
                    <Switch
                      value={soundEffects}
                      onValueChange={setSoundEffects}
                      trackColor={{
                        false: colors.text + "40",
                        true: colors.primary,
                      }}
                      thumbColor="white"
                      style={isDesktop ? { transform: [{ scale: 0.55 }] } : {}}
                    />
                  </View>
                </View>

                {/* HESAP BÖLÜMÜ */}
                <View
                  style={[
                    styles.menuSection,
                    {
                      paddingHorizontal: scale(isDesktop ? 10 : 20),
                      marginTop: scale(isDesktop ? 6 : 20),
                    },
                  ]}
                >
                  <CustomText
                    style={[
                      styles.sectionTitle,
                      {
                        fontSize: scale(isDesktop ? 9 : 14),
                        color: colors.text + "80",
                        marginBottom: scale(isDesktop ? 4 : 10),
                        fontWeight: "600",
                        letterSpacing: 0.5,
                      },
                    ]}
                  >
                    HESAP
                  </CustomText>

                  {/* Profili Düzenle */}
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 4 : 10),
                      },
                    ]}
                    onPress={handleEditProfile}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="person"
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        Profili Düzenle
                      </CustomText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={scale(isDesktop ? 12 : 20)}
                      color={colors.text + "60"}
                    />
                  </TouchableOpacity>

                  {/* Gizlilik */}
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 4 : 10),
                      },
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        Gizlilik
                      </CustomText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={scale(isDesktop ? 12 : 20)}
                      color={colors.text + "60"}
                    />
                  </TouchableOpacity>

                  {/* Yardım */}
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 4 : 10),
                      },
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="help-circle"
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        Yardım
                      </CustomText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={scale(isDesktop ? 12 : 20)}
                      color={colors.text + "60"}
                    />
                  </TouchableOpacity>

                  {/* Hakkında */}
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: colors.card,
                        padding: scale(isDesktop ? 8 : 15),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        marginBottom: scale(isDesktop ? 4 : 10),
                      },
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name="information-circle"
                        size={scale(isDesktop ? 12 : 20)}
                        color={colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 11 : 16),
                          color: colors.text,
                          marginLeft: scale(isDesktop ? 6 : 12),
                        }}
                      >
                        Hakkında
                      </CustomText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={scale(isDesktop ? 12 : 20)}
                      color={colors.text + "60"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Çıkış Yap Butonu */}
                <View
                  style={[
                    styles.footer,
                    { padding: scale(isDesktop ? 10 : 20) },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.signOutButton,
                      {
                        backgroundColor: user
                          ? "#FF3B3015"
                          : colors.primary + "15",
                        padding: scale(isDesktop ? 8 : 16),
                        borderRadius: scale(isDesktop ? 6 : 12),
                        borderWidth: 1,
                        borderColor: user ? "#FF3B3030" : colors.primary + "30",
                      },
                    ]}
                    onPress={() => {
                      if (!user) {
                        closeDrawer();
                        router.push("/(auth)");
                      } else {
                        handleSignOut();
                      }
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={user ? "log-out-outline" : "log-in-outline"}
                        size={scale(isDesktop ? 14 : 22)}
                        color={user ? "#FF3B30" : colors.primary}
                      />
                      <CustomText
                        style={{
                          fontSize: scale(isDesktop ? 12 : 18),
                          color: user ? "#FF3B30" : colors.primary,
                          marginLeft: scale(isDesktop ? 4 : 10),
                          fontWeight: "600",
                        }}
                      >
                        {user ? "Çıkış Yap" : "Giriş Yap"}
                      </CustomText>
                    </View>
                  </TouchableOpacity>

                  <CustomText
                    style={{
                      fontSize: scale(isDesktop ? 8 : 12),
                      color: colors.text + "40",
                      textAlign: "center",
                      marginTop: scale(isDesktop ? 6 : 16),
                      marginBottom: scale(isDesktop ? 6 : 20),
                    }}
                  >
                    Versiyon 1.0.0
                  </CustomText>
                </View>
              </ScrollView>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </Modal>

      {/* Profil Düzenleme Modalı */}
      <ProfileEditModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />

      <AuthRequiredModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  menuSection: {},
  sectionTitle: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footer: {},
  signOutButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
