import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const bannerNames = [
  "Yıldızlar",
  "Medusa",
  "Pegasus",
  "Güller",
  "Kırmızı Kale",
  "Çöl",
  "Çift Başlı Kartal",
  "Mistik Orman",
  "Ağaçlık",
  "Son Kasımpatı",
  "Bahar Ormanı",
  "Dal Girdabı",
  "Yüce Dağlar",
  "Okyanus",
  "Orkide Demeti",
  "Tavus Kuşu Ormanı",
  "Zümrüdüanka",
  "Uzay Manzarası",
  "Yaprak Yığını",
  "Kurt Kanat",
];

interface BannerSectionProps {
  scrollY: Animated.Value;
  bannerOpacity: Animated.AnimatedInterpolation<number>;
  selectedBannerIndex: number;
  onBannerChange: (index: number) => void;
  isOwnProfile?: boolean;
}

export default function BannerSection({
  scrollY,
  bannerOpacity,
  selectedBannerIndex,
  onBannerChange,
  isOwnProfile = true,
}: BannerSectionProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [showBannerSelector, setShowBannerSelector] = useState(false);

  const currentBanner = allBanners[selectedBannerIndex];

  const handleBannerSelect = (index: number) => {
    onBannerChange(index);
    setShowBannerSelector(false);
  };

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
        <TouchableOpacity
          style={styles.bannerTouchable}
          onPress={() => isOwnProfile && setShowBannerSelector(true)}
          activeOpacity={isOwnProfile ? 0.8 : 1}
          disabled={!isOwnProfile}
        >
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
        </TouchableOpacity>
      </Animated.View>

      {isOwnProfile && (
        <BottomSheetModal
          visible={showBannerSelector}
          onClose={() => setShowBannerSelector(false)}
          title="Banner Seç"
          height="85%"
          showCloseButton={true}
          showDragHandle={true}
          closeOnBackdropPress={true}
          closeOnSwipeDown={true}
          desktopWidth={scale(600)}
        >
          <ScrollView
            style={styles.bannerGrid}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              { paddingBottom: 20 },
              isDesktop && {
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                paddingHorizontal: scale(10),
              },
            ]}
          >
            {allBanners.map((banner, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.bannerOption,
                  {
                    backgroundColor: colors.card,
                    marginBottom: scale(15),
                    borderRadius: scale(12),
                    overflow: "hidden",
                  },
                  isDesktop && { width: "48%" },
                ]}
                activeOpacity={0.7}
                onPress={() => handleBannerSelect(index)}
              >
                <Image
                  source={banner}
                  style={[
                    styles.bannerOptionImage,
                    {
                      width: "100%",
                      height: isDesktop ? scale(80) : SCREEN_WIDTH * 0.25,
                    },
                  ]}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.bannerOptionOverlay,
                    { backgroundColor: colors.card + "CC" },
                  ]}
                >
                  <CustomText
                    style={{
                      color: colors.text,
                      // DÜZELTME: Masaüstü için banner adlarının boyutu daha da küçültüldü
                      fontSize: scale(isDesktop ? 10 : 14),
                      fontWeight: "500",
                    }}
                    numberOfLines={1}
                  >
                    {bannerNames[index]}
                  </CustomText>
                  {selectedBannerIndex === index && (
                    <View
                      style={[
                        styles.selectedBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={scale(16)}
                        color="white"
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetModal>
      )}
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
  bannerGrid: {
    flex: 1,
  },
  bannerOption: {
    width: "100%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerOptionImage: {
    width: "100%",
  },
  bannerOptionOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
