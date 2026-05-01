import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useDailyStreak } from "@contexts/DailyStreakContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { getAvatarSource } from "@utils/avatarUtils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeInfoBoxes() {
  const { colors, themeMode } = useTheme();
  const { user } = useAuth();
  const { scale, isDesktop } = useResponsive();
  const {
    streakData,
    loading: streakLoading,
    refreshStreak,
  } = useDailyStreak();

  const [avatarIndex, setAvatarIndex] = useState(0);
  const [username, setUsername] = useState("Misafir");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(
      "📊 HomeInfoBoxes - Streak verisi güncellendi:",
      streakData?.current_streak,
    );
  }, [streakData]);

  // Kullanıcı yoksa misafir değerlerini kullan
  const dailyStreak = user ? streakData?.current_streak || 0 : 0;
  const completedTasks = user ? 12 : 0; // Geçici Örnek Veri

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_index")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ HomeInfoBoxes - Profile fetch error:", error);
        return;
      }

      if (data) {
        setUsername(data.username || user?.email?.split("@")[0] || "Kullanıcı");
        setAvatarIndex(data.avatar_index || 0);
      }
    } catch (error) {
      console.error("❌ HomeInfoBoxes - Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setUsername("Misafir");
      setAvatarIndex(0);
      setLoading(false);
      return;
    }

    fetchProfile();

    const subscription = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new;
          if (newProfile.avatar_index !== undefined) {
            setAvatarIndex(newProfile.avatar_index);
          }
          if (newProfile.username) {
            setUsername(newProfile.username);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshStreak();
    }
  }, [user]);

  const avatarSource = getAvatarSource(avatarIndex);

  if (isDesktop) {
    return null;
  }

  // MOBİL İÇİN DİNAMİK ÖLÇÜLER VE MATEMATİKSEL HİZALAMA
  const rowStyle = { justifyContent: "space-between" as const };
  const wideBoxStyle = { width: "48%" as const, aspectRatio: 3.2 };
  const smallBoxStyle = { flex: 1, aspectRatio: 1 };

  const rightBoxesContainerStyle = {
    width: "48%" as const,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 8,
  };

  const profileAvatarSize = scale(32);
  const profileFontSize = scale(14);
  const smallBoxIconSize = scale(24);
  const dailyIconSize = scale(24);
  const dailyValueFontSize = scale(16);
  const dailyLabelFontSize = scale(11);
  const taskCountFontSize = scale(20);
  const taskBarHeight = scale(6);
  const boxBorderRadius = scale(12);

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: scale(16), marginTop: scale(16) },
      ]}
    >
      {/* Birinci Satır */}
      <View style={[styles.topRow, rowStyle]}>
        {/* Sol: Profil Kutusu */}
        <TouchableOpacity
          style={[
            styles.boxShadow,
            wideBoxStyle,
            {
              backgroundColor: colors.card,
              borderRadius: boxBorderRadius,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() =>
            user ? router.push("/profile") : router.push("/(auth)")
          }
        >
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={avatarSource}
                style={{
                  width: profileAvatarSize,
                  height: profileAvatarSize,
                  borderRadius: profileAvatarSize / 2,
                }}
                resizeMode="cover"
              />
            </View>

            <CustomText
              style={[
                styles.username,
                {
                  color: user ? colors.text : colors.primary,
                  fontSize: profileFontSize,
                  fontWeight: "600",
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user ? username : "Giriş Yap"}
            </CustomText>
          </View>
        </TouchableOpacity>

        {/* Sağ: 3 küçük kutu */}
        <View style={rightBoxesContainerStyle}>
          {/* İstatistikler */}
          <TouchableOpacity
            style={[
              styles.boxShadow,
              smallBoxStyle,
              {
                backgroundColor: colors.card,
                borderRadius: boxBorderRadius,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.push("/duel/statistics")}
          >
            <Ionicons
              name="analytics"
              size={smallBoxIconSize}
              color={colors.primary}
            />
          </TouchableOpacity>

          {/* Kahramanlar (Kral Tacı) */}
          <TouchableOpacity
            style={[
              styles.boxShadow,
              smallBoxStyle,
              {
                backgroundColor: colors.card,
                borderRadius: boxBorderRadius,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.push("/duel/heroes")}
          >
            <FontAwesome5
              name="crown"
              size={smallBoxIconSize}
              color="#4ECDC4"
            />
          </TouchableOpacity>

          {/* Liderlik */}
          <TouchableOpacity
            style={[
              styles.boxShadow,
              smallBoxStyle,
              {
                backgroundColor: colors.card,
                borderRadius: boxBorderRadius,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.push("/duel/leaderboard")}
          >
            <Ionicons name="trophy" size={smallBoxIconSize} color="#FFD93D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* İkinci Satır */}
      <View style={[styles.bottomRow, rowStyle, { marginTop: scale(12) }]}>
        {/* Sol: Günlük Seri Kutusu */}
        <TouchableOpacity
          style={[
            styles.boxShadow,
            wideBoxStyle,
            {
              backgroundColor: colors.card,
              borderRadius: boxBorderRadius,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => user && refreshStreak()}
        >
          <View style={styles.dailyContent}>
            <Ionicons name="flame" size={dailyIconSize} color="#FF6B6B" />
            <View style={styles.dailyTextContainer}>
              <CustomText
                style={[
                  styles.dailyValue,
                  {
                    color: colors.text,
                    fontSize: dailyValueFontSize,
                    fontWeight: "bold",
                  },
                ]}
              >
                {streakLoading && user ? "..." : dailyStreak}
              </CustomText>
              <CustomText
                style={[
                  styles.dailyLabel,
                  { color: colors.text + "80", fontSize: dailyLabelFontSize },
                ]}
              >
                GÜN
              </CustomText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Sağ: Görev İlerleme Kutusu */}
        <TouchableOpacity
          style={[
            styles.boxShadow,
            wideBoxStyle,
            {
              backgroundColor: colors.card,
              borderRadius: boxBorderRadius,
              borderWidth: 1,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.taskContent}>
            <CustomText
              style={[
                styles.taskCount,
                {
                  color: colors.primary,
                  fontSize: taskCountFontSize,
                  fontWeight: "bold",
                },
              ]}
            >
              {completedTasks}
            </CustomText>

            <View style={styles.taskProgressContainer}>
              <View
                style={[
                  styles.taskProgressBar,
                  {
                    backgroundColor: colors.text + "20",
                    height: taskBarHeight,
                    borderRadius: taskBarHeight / 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.taskProgressFill,
                    {
                      width: `${(completedTasks / 30) * 100}%`,
                      backgroundColor: colors.primary,
                      height: taskBarHeight,
                      borderRadius: taskBarHeight / 2,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  boxShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  username: {
    fontWeight: "600",
  },
  dailyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  dailyTextContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  dailyValue: {
    fontWeight: "bold",
  },
  dailyLabel: {
    letterSpacing: 0.5,
  },
  taskContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  taskCount: {
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
  },
  taskProgressContainer: {
    flex: 1,
    justifyContent: "center",
  },
  taskProgressBar: {
    width: "100%",
    overflow: "hidden",
  },
  taskProgressFill: {
    height: "100%",
  },
});
