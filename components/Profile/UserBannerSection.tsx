import { useResponsive } from "@hooks/useResponsive";
import { getBannerSource } from "@utils/bannerUtils";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface UserBannerSectionProps {
  scrollY: Animated.Value;
  bannerOpacity: Animated.AnimatedInterpolation<number>;
  bannerIndex: number;
}

export default function UserBannerSection({
  scrollY,
  bannerOpacity,
  bannerIndex,
}: UserBannerSectionProps) {
  const { scale, isDesktop } = useResponsive();
  const currentBanner = getBannerSource(bannerIndex);

  const bannerHeight = isDesktop ? scale(120) : SCREEN_WIDTH / 3;

  return (
    <View style={{ position: "relative", zIndex: 10 }}>
      <Animated.View
        style={[
          styles.bannerContainer,
          {
            height: bannerHeight,
            opacity: bannerOpacity,
          },
          isDesktop && {
            borderBottomLeftRadius: scale(16),
            borderBottomRightRadius: scale(16),
          },
        ]}
      >
        <View style={styles.bannerTouchable}>
          <Image
            source={currentBanner}
            style={[
              styles.bannerImage,
              {
                height: bannerHeight,
              },
            ]}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: "relative",
    overflow: "hidden",
  },
  bannerTouchable: {
    width: "100%",
    height: "100%",
  },
  bannerImage: {
    width: "100%",
  },
});
