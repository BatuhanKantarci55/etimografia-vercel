import { Redirect } from "expo-router";

export default function Index() {
  // Artık uygulamayı açan herkes (misafirler dahil) doğrudan sekmeli ana sayfaya yönlendirilecek.
  return <Redirect href="/(tabs)" />;
}
