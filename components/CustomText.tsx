import React from "react";
import { Text as RNText, StyleSheet, TextProps } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

type CustomTextProps = TextProps & {
  variant?: "default" | "bold" | "extraBold" | "title" | "subtitle" | "small";
  color?: "primary" | "secondary" | "text" | "white" | "gray";
  fontFamily?: "extraBold" | "medium" | "regular"; // Yeni prop
};

export default function CustomText({
  variant = "default",
  color = "text",
  fontFamily = "extraBold", // Varsayılan extraBold
  style,
  children,
  ...props
}: CustomTextProps) {
  const { colors } = useTheme();

  const variantStyles = {
    default: styles.default,
    bold: styles.bold,
    extraBold: styles.extraBold,
    title: styles.title,
    subtitle: styles.subtitle,
    small: styles.small,
  };

  const colorStyles = {
    primary: { color: colors.primary },
    secondary: { color: colors.secondary },
    text: { color: colors.text },
    white: { color: "#FFFFFF" },
    gray: { color: "#888888" },
  };

  // Font ailesini belirle
  const getFontFamily = () => {
    switch (fontFamily) {
      case "extraBold":
        return "Nunito-ExtraBold";
      case "medium":
        return "Nunito-Medium";
      case "regular":
        return "Nunito-Regular";
      default:
        return "Nunito-ExtraBold";
    }
  };

  return (
    <RNText
      style={[
        variantStyles[variant],
        colorStyles[color],
        { fontFamily: getFontFamily() },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 16 },
  bold: { fontSize: 16, fontWeight: "700" },
  extraBold: { fontSize: 18, fontWeight: "800" },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 20, fontWeight: "700" },
  small: { fontSize: 12 },
});
