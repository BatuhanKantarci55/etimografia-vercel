// app/_layout.tsx
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ArenaProvider } from "../contexts/ArenaContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CommentProvider } from "../contexts/CommentContext";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import { DailyStreakProvider } from "../contexts/DailyStreakContext";
import { DiamondRewardProvider } from "../contexts/DiamondRewardContext";
import { DuelProvider } from "../contexts/DuelContext";
import { EducationProvider } from "../contexts/EducationContext";
import { FollowProvider } from "../contexts/FollowContext";
import { FontProvider, useFonts } from "../contexts/FontContext";
import { GameModeProvider } from "../contexts/GameModeContext";
import { GoldRewardProvider } from "../contexts/GoldRewardContext";
import { HeroProvider } from "../contexts/HeroContext";
import { LevelProvider } from "../contexts/LevelContext";
import { MessageProvider } from "../contexts/MessageContext";
import { PostProvider } from "../contexts/PostContext";
import { PracticeProvider } from "../contexts/PracticeContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

function RootLayoutNav() {
  const { user, initialized } = useAuth();
  const { fontsLoaded } = useFonts();
  const { themeMode } = useTheme();

  useEffect(() => {
    const updateSystemBars = async () => {
      if (Platform.OS === "android") {
        try {
          const navBarColor = themeMode === "dark" ? "#121212" : "#f5f5f5";
          const buttonStyle = themeMode === "dark" ? "light" : "dark";

          await NavigationBar.setBackgroundColorAsync(navBarColor);
          await NavigationBar.setButtonStyleAsync(buttonStyle);
        } catch (error) {
          console.error("Navigation bar ayarlanırken hata:", error);
        }
      }

      const statusBarStyle =
        themeMode === "dark" ? "light-content" : "dark-content";
      StatusBar.setBarStyle(statusBarStyle);
      StatusBar.setBackgroundColor("transparent", true);
    };

    updateSystemBars();
  }, [themeMode]);

  if (!fontsLoaded || !initialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // KOŞULLU RENDER'I KALDIRIYORUZ: Tüm stack'ler her zaman yüklü kalmalı.
  // Yönlendirme işlemini AuthContext halledecek.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DailyStreakProvider>
          <LevelProvider>
            <FollowProvider>
              <PostProvider>
                <CommentProvider>
                  <MessageProvider>
                    <GameModeProvider>
                      <PracticeProvider>
                        <DuelProvider>
                          <EducationProvider>
                            <ArenaProvider>
                              <HeroProvider>
                                <CurrencyProvider>
                                  <GoldRewardProvider>
                                    <DiamondRewardProvider>
                                      {children}
                                    </DiamondRewardProvider>
                                  </GoldRewardProvider>
                                </CurrencyProvider>
                              </HeroProvider>
                            </ArenaProvider>
                          </EducationProvider>
                        </DuelProvider>
                      </PracticeProvider>
                    </GameModeProvider>
                  </MessageProvider>
                </CommentProvider>
              </PostProvider>
            </FollowProvider>
          </LevelProvider>
        </DailyStreakProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FontProvider>
          <Providers>
            <RootLayoutNav />
          </Providers>
        </FontProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
