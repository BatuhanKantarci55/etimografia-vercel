import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import CustomText from "./CustomText";

type NavbarProps = {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  transparent?: boolean;
};

export default function Navbar({
  title,
  showBack = false,
  onBackPress,
  rightComponent,
  leftComponent,
  transparent = false,
}: NavbarProps) {
  const { colors, themeMode } = useTheme();
  const { scale, isIOS } = useResponsive();

  // StatusBar rengini ayarla
  React.useEffect(() => {
    if (Platform.OS !== "web") {
      StatusBar.setBarStyle(
        themeMode === "dark" ? "light-content" : "dark-content",
      );
      StatusBar.setBackgroundColor(transparent ? "transparent" : colors.card);
    }
  }, [themeMode, colors.card, transparent]);

  return (
    <View
      style={{
        backgroundColor: transparent ? "transparent" : colors.card,
      }}
    >
      {Platform.OS !== "web" && (
        <View style={{ height: StatusBar.currentHeight }} />
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: transparent ? "transparent" : colors.card,
            paddingHorizontal: scale(16),
            paddingVertical: scale(12),
            paddingTop: Platform.OS === "ios" ? scale(40) : scale(12),
          },
        ]}
      >
        <View style={[styles.left, { width: scale(40) }]}>
          {showBack ? (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={scale(20)}
                color={colors.text}
              />
            </TouchableOpacity>
          ) : (
            leftComponent
          )}
        </View>

        <View style={styles.center}>
          {title && (
            <CustomText
              variant="subtitle"
              style={{ fontSize: scale(18), color: colors.text }}
            >
              {title}
            </CustomText>
          )}
        </View>

        <View style={[styles.right, { width: scale(40) }]}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
}

// Stiller aynı...

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    alignItems: "flex-start",
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  right: {
    alignItems: "flex-end",
  },
  backButton: {
    padding: 8,
  },
});
