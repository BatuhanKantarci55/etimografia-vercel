import { Stack } from "expo-router";

export default function DuelLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="filter" />
      <Stack.Screen name="waiting" />
      <Stack.Screen name="session" />
      <Stack.Screen name="statistics" />
      <Stack.Screen name="leaderboard" />
    </Stack>
  );
}
