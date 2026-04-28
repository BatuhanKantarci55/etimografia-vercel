import {
  Dimensions,
  Platform,
  ScaledSize,
  useWindowDimensions,
} from "react-native";

const { width, height }: ScaledSize = Dimensions.get("window");

export const useResponsive = () => {
  // useWindowDimensions ile gerçek zamanlı boyutları al
  const windowDimensions = useWindowDimensions();
  const currentWidth = windowDimensions.width;
  const currentHeight = windowDimensions.height;

  const isAndroid = Platform.OS === "android";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  // Yatay/Dikey kontrolü
  const isLandscape = currentWidth > currentHeight;

  const isSmallDevice = currentWidth < 375;
  const isMediumDevice = currentWidth >= 375 && currentWidth < 414;
  const isLargeDevice = currentWidth >= 414;
  const isTablet = currentWidth >= 768;

  // DEĞİŞİKLİK: Oran şartı 0.75'ten 0.5'e (1:2 oran), genişlik sınırı ise 768'den 650'ye düşürüldü.
  // Böylece ekran çok daha fazla daraltılana kadar bilgisayar (kompakt) görünümünde kalacak.
  const isDesktop = isWeb
    ? currentWidth / currentHeight > 0.5 && currentWidth >= 650
    : currentWidth >= 1024;

  // 1200 pikselin altına düştüğünde kompakt (sıkıştırılmış) masaüstü moduna geçişi belirleyen mantık.
  const isCompactDesktop = isDesktop && currentWidth < 1200;

  const scaleSize = (size: number): number => {
    // Desktop'ta scale'ı sınırla
    let scaleFactor = currentWidth / 375;
    if (isDesktop) {
      scaleFactor = Math.min(scaleFactor, 1.5);
    }
    return Math.round(size * scaleFactor);
  };

  const wp = (percent: number): number => {
    // Desktop'ta maksimum genişlik
    const maxWidth = isDesktop ? 500 : currentWidth;
    return (Math.min(currentWidth, maxWidth) * percent) / 100;
  };

  const hp = (percent: number): number => (currentHeight * percent) / 100;

  // Responsive font size (yatay ekranlarda fontları küçült)
  const fontSize = (size: number): number => {
    let adjustedSize = size;
    if (isLandscape && !isTablet && !isDesktop) {
      // Telefon yatay modda fontları %80'e düşür
      adjustedSize = size * 0.8;
    } else if (isTablet && !isDesktop) {
      // Tablet'te fontları normal boyutta tut
      adjustedSize = size;
    } else if (isDesktop) {
      // Desktop'ta fontları biraz büyüt
      adjustedSize = size * 1.1;
    }
    return scaleSize(adjustedSize);
  };

  // Responsive spacing (yatay ekranlarda boşlukları ayarla)
  const spacing = (size: number): number => {
    let adjustedSize = size;
    if (isLandscape && !isTablet && !isDesktop) {
      // Telefon yatay modda boşlukları küçült
      adjustedSize = size * 0.7;
    } else if (isDesktop) {
      // Desktop'ta boşlukları biraz büyüt
      adjustedSize = size * 1.2;
    }
    return scaleSize(adjustedSize);
  };

  return {
    width: currentWidth,
    height: currentHeight,
    isLandscape,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    isDesktop,
    isCompactDesktop,
    isAndroid,
    isIOS,
    isWeb,
    scale: scaleSize,
    wp,
    hp,
    fontSize,
    spacing,
  };
};
