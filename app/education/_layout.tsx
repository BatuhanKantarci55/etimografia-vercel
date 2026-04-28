import { useEducation } from "@contexts/EducationContext";
import { useTheme } from "@contexts/ThemeContext";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function EducationLayout() {
  const { loading, progress } = useEducation();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="step1" />
      <Stack.Screen name="step2" />
      <Stack.Screen name="step3" />
    </Stack>
  );
}
