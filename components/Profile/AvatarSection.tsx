import AuthRequiredModal from "@components/AuthRequiredModal";
import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import {
  freeAvatars,
  getAvatarSource,
  premiumAvatars,
} from "@utils/avatarUtils";
import { useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AVATAR_SIZE = SCREEN_WIDTH / 4 - 24;

interface AvatarSectionProps {
  scrollY: Animated.Value;
  avatarScale: Animated.AnimatedInterpolation<number>;
  avatarOpacity: Animated.AnimatedInterpolation<number>;
  avatarTranslateY: Animated.AnimatedInterpolation<number>;
  selectedAvatarIndex: number;
  onAvatarChange: (index: number) => void;
  isOwnProfile?: boolean;
  purchasedAvatars?: Set<number>;
}

export default function AvatarSection({
  scrollY,
  avatarScale,
  avatarOpacity,
  avatarTranslateY,
  selectedAvatarIndex,
  onAvatarChange,
  isOwnProfile = true,
  purchasedAvatars = new Set(),
}: AvatarSectionProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { scale, isDesktop } = useResponsive();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const currentAvatar = getAvatarSource(selectedAvatarIndex);
  const mainAvatarSize = scale(isDesktop ? 80 : 100);
  const mainAvatarRadius = mainAvatarSize / 2;

  const columns = isDesktop ? 5 : 4;
  const currentAvatarItemSize = isDesktop ? scale(55) : AVATAR_SIZE;

  // Sadece kullanıcının sahip olduğu avatarları göster
  const getOwnedAvatars = () => {
    const ownedList: any[] = [];

    // Ücretsiz avatarlar (herkese açık)
    freeAvatars.forEach((avatar, index) => {
      ownedList.push({ image: avatar, index, isPremium: false, owned: true });
    });

    // Ücretli avatarlar (sadece satın alınanlar)
    premiumAvatars.forEach((avatar) => {
      const isOwned = purchasedAvatars.has(avatar.index);
      ownedList.push({
        image: avatar.image,
        index: avatar.index,
        isPremium: true,
        owned: isOwned,
        name: avatar.name,
      });
    });

    // Sadece sahip olunanları filtrele
    return ownedList.filter((item) => item.owned);
  };

  const ownedAvatars = getOwnedAvatars();

  const handlePress = () => {
    if (!isOwnProfile) return;
    if (!user) {
      setAuthModalVisible(true);
      return;
    }
    setShowAvatarSelector(true);
  };

  const renderAvatarItem = ({ item }: { item: any }) => {
    const isPremium = item.isPremium;
    const isSelected = selectedAvatarIndex === item.index;
    const isGoldBorder = isPremium; // Premium avatarlar altın kenarlıklı

    return (
      <TouchableOpacity
        style={[
          styles.avatarItem,
          {
            width: currentAvatarItemSize,
            height: currentAvatarItemSize,
            marginHorizontal: isDesktop ? scale(6) : 0,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          onAvatarChange(item.index);
          setShowAvatarSelector(false);
        }}
      >
        <View
          style={[
            styles.avatarBorder,
            {
              width: currentAvatarItemSize,
              height: currentAvatarItemSize,
              borderRadius: currentAvatarItemSize / 2,
              borderWidth: isGoldBorder ? 2 : 0,
              borderColor: isGoldBorder ? "#FFD700" : "transparent",
            },
          ]}
        >
          <Image
            source={item.image}
            style={[
              styles.avatarImage,
              {
                width: currentAvatarItemSize,
                height: currentAvatarItemSize,
                borderRadius: currentAvatarItemSize / 2,
                borderWidth: isSelected ? 3 : 0,
                borderColor: isSelected ? colors.primary : "transparent",
              },
            ]}
            resizeMode="cover"
          />
        </View>
        {isPremium && (
          <View
            style={[
              styles.premiumBadge,
              { backgroundColor: "rgba(0,0,0,0.6)" },
            ]}
          >
            <Ionicons name="star" size={scale(12)} color="#FFD700" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ position: "relative", zIndex: 100, elevation: 100 }}>
      <Animated.View
        style={[
          styles.avatarContainer,
          {
            transform: [
              { scale: avatarScale },
              { translateY: avatarTranslateY },
            ],
            opacity: avatarOpacity,
            top: -mainAvatarRadius,
            zIndex: 100,
            elevation: 100,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.avatarTouchable,
            {
              width: mainAvatarSize,
              height: mainAvatarSize,
              borderRadius: mainAvatarRadius,
            },
          ]}
          onPress={handlePress}
          activeOpacity={isOwnProfile ? 0.8 : 1}
          disabled={!isOwnProfile}
        >
          <Image
            source={currentAvatar}
            style={[
              styles.avatarImageMain,
              {
                width: mainAvatarSize,
                height: mainAvatarSize,
                borderRadius: mainAvatarRadius,
                borderWidth: scale(isDesktop ? 3 : 4),
                borderColor: colors.background,
              },
            ]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </Animated.View>

      {isOwnProfile && (
        <BottomSheetModal
          visible={showAvatarSelector}
          onClose={() => setShowAvatarSelector(false)}
          title="Avatar Seç"
          height="70%"
          showCloseButton={true}
          showDragHandle={true}
          closeOnBackdropPress={true}
          closeOnSwipeDown={true}
          desktopWidth={scale(400)}
        >
          <FlatList
            key={isDesktop ? "desktop-5" : "mobile-4"}
            data={ownedAvatars}
            renderItem={renderAvatarItem}
            keyExtractor={(item) => item.index.toString()}
            numColumns={columns}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avatarGrid}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <CustomText
                  style={{ color: colors.text + "80", textAlign: "center" }}
                >
                  Henüz satın alınmış avatar yok.
                </CustomText>
              </View>
            }
          />
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
  avatarContainer: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 100,
  },
  avatarTouchable: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  avatarImageMain: {},
  avatarGrid: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  avatarItem: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarBorder: {
    overflow: "hidden",
  },
  avatarImage: {},
  premiumBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
