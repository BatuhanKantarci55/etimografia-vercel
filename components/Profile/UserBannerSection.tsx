import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = SCREEN_WIDTH / 3;

// Banner görsellerini import et
const allBanners = [
  require("../../assets/images/banners/stars.png"),
  require("../../assets/images/banners/medusa.png"),
  require("../../assets/images/banners/pegasus.png"),
  require("../../assets/images/banners/roses.png"),
  require("../../assets/images/banners/red_castle.png"),
  require("../../assets/images/banners/desert.png"),
  require("../../assets/images/banners/eagle.png"),
  require("../../assets/images/banners/fairy.png"),
  require("../../assets/images/banners/fall.png"),
  require("../../assets/images/banners/flowers.png"),
  require("../../assets/images/banners/forest.png"),
  require("../../assets/images/banners/leaves.png"),
  require("../../assets/images/banners/mountains.png"),
  require("../../assets/images/banners/ocean.png"),
  require("../../assets/images/banners/orchid.png"),
  require("../../assets/images/banners/peacock.png"),
  require("../../assets/images/banners/phoenix.png"),
  require("../../assets/images/banners/space.png"),
  require("../../assets/images/banners/tree.png"),
  require("../../assets/images/banners/wolf.png"),
];

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
  const currentBanner = allBanners[bannerIndex % allBanners.length];

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          height: BANNER_HEIGHT,
          opacity: bannerOpacity,
        },
      ]}
    >
      <View style={styles.bannerTouchable}>
        <Image
          source={currentBanner}
          style={[
            styles.bannerImage,
            {
              height: BANNER_HEIGHT,
            },
          ]}
          resizeMode="cover"
        />
      </View>
    </Animated.View>
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
