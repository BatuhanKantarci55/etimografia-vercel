import AuthRequiredModal from "@components/AuthRequiredModal";
import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import {
  allBannerNames,
  freeBanners,
  getBannerSource,
  premiumBanners
} from "@utils/bannerUtils";
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

interface BannerSectionProps {
  scrollY: Animated.Value;
  bannerOpacity: Animated.AnimatedInterpolation<number>;
  selectedBannerIndex: number;
  onBannerChange: (index: number) => void;
  isOwnProfile?: boolean;
  purchasedBanners?: Set<number>;
}

export default function BannerSection({
  scrollY,
  bannerOpacity,
  selectedBannerIndex,
  onBannerChange,
  isOwnProfile = true,
  purchasedBanners = new Set(),
}: BannerSectionProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { scale, isDesktop } = useResponsive();
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const currentBanner = getBannerSource(selectedBannerIndex);

  // Sadece kullanıcının sahip olduğu banner'ları göster
  const getOwnedBanners = () => {
    const ownedList: any[] = [];

    // Ücretsiz banner'lar (herkese açık)
    freeBanners.forEach((banner, index) => {
      ownedList.push({
        image: banner,
        index,
        isPremium: false,
        owned: true,
        name: allBannerNames[index],
      });
    });

    // Ücretli banner'lar (sadece satın alınanlar)
    premiumBanners.forEach((banner) => {
      const isOwned = purchasedBanners.has(banner.index);
      ownedList.push({
        image: banner.image,
        index: banner.index,
        isPremium: true,
        owned: isOwned,
        name: banner.name,
        price: banner.price,
        currency: banner.currency,
      });
    });

    // Sadece sahip olunanları filtrele
    return ownedList.filter((item) => item.owned);
  };

  const ownedBanners = getOwnedBanners();

  const handlePress = () => {
    if (!isOwnProfile) return;
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    setShowBannerSelector(true);
  };

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
          onPress={handlePress}
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
            {ownedBanners.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CustomText
                  style={{ color: colors.text + "80", textAlign: "center" }}
                >
                  Henüz satın alınmış banner yok.
                </CustomText>
              </View>
            ) : (
              ownedBanners.map((item) => {
                const isPremium = item.isPremium;
                const isSelected = selectedBannerIndex === item.index;

                return (
                  <TouchableOpacity
                    key={item.index}
                    style={[
                      styles.bannerOption,
                      {
                        backgroundColor: colors.card,
                        marginBottom: scale(15),
                        borderRadius: scale(12),
                        overflow: "hidden",
                        borderWidth: isPremium ? 2 : 0,
                        borderColor: isPremium ? "#FFD700" : "transparent",
                      },
                      isDesktop && { width: "48%" },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleBannerSelect(item.index)}
                  >
                    <Image
                      source={item.image}
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
                          fontSize: scale(isDesktop ? 10 : 14),
                          fontWeight: "500",
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </CustomText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {isPremium && (
                          <Ionicons
                            name="star"
                            size={scale(14)}
                            color="#FFD700"
                          />
                        )}
                        {isSelected && (
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
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </BottomSheetModal>
      )}

      <AuthRequiredModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
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
    position: "relative",
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
