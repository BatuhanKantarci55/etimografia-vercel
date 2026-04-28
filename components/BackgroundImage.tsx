import { backgroundImages } from "@constants/BackgroundImages";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { ImageBackground, StyleSheet, View, ViewProps } from "react-native";

interface BackgroundImageProps extends ViewProps {
  children: React.ReactNode;
  overlayOpacity?: number;
}

export default function BackgroundImage({
  children,
  style,
  overlayOpacity = 0.1,
  ...props
}: BackgroundImageProps) {
  const { themeMode, appMode } = useTheme();
  const { isTablet, isDesktop, isWeb, isLandscape, width, height } =
    useResponsive();

  // Yatay ekran kontrolü (Tablet + Desktop + Telefon yatay)
  const useHorizontal = isLandscape || isTablet || isDesktop;

  // Uygun arka plan görselini seç
  const orientationImages = backgroundImages[appMode][themeMode];
  const backgroundImage = useHorizontal
    ? orientationImages?.horizontal
    : orientationImages?.vertical;

  // Desktop veya Web'de ve görsel yoksa sadece renk kullan
  if ((isDesktop || isWeb) && !backgroundImage) {
    return (
      <View style={[styles.container, style]} {...props}>
        {children}
      </View>
    );
  }

  // Görsel varsa ImageBackground kullan
  if (backgroundImage) {
    return (
      <ImageBackground
        source={backgroundImage}
        style={[styles.container, style]}
        resizeMode="cover"
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: `rgba(0, 0, 0, ${themeMode === "dark" ? overlayOpacity * 2 : overlayOpacity})`,
            },
          ]}
        />
        {children}
      </ImageBackground>
    );
  }

  // Görsel yoksa sadece View döndür
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
