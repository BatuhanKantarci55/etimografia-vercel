// app/+not-found.tsx
import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import CustomText from "../components/CustomText";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <CustomText style={styles.text}>Bu sayfa bulunamadı.</CustomText>
        <Link href="/(auth)" style={styles.link}>
          <CustomText>Ana Sayfaya Dön</CustomText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
