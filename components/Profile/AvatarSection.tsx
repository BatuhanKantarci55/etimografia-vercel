import BottomSheetModal from "@components/BottomSheetModal";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
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

// Avatar görsellerini import et
const allAvatars = [
  require("../../assets/images/avatars/cat1.jpg"),
  require("../../assets/images/avatars/cat2.jpg"),
  require("../../assets/images/avatars/chicken1.png"),
  require("../../assets/images/avatars/cockatiel1.png"),
  require("../../assets/images/avatars/cow1.png"),
  require("../../assets/images/avatars/dolphin1.jpg"),
  require("../../assets/images/avatars/donkey1.png"),
  require("../../assets/images/avatars/duck1.png"),
  require("../../assets/images/avatars/elephant1.jpg"),
  require("../../assets/images/avatars/fox1.png"),
  require("../../assets/images/avatars/horse1.png"),
  require("../../assets/images/avatars/jellyfish1.jpg"),
  require("../../assets/images/avatars/kakadu1.png"),
  require("../../assets/images/avatars/octopus1.jpg"),
  require("../../assets/images/avatars/penguen1.jpg"),
  require("../../assets/images/avatars/penguen2.jpg"),
  require("../../assets/images/avatars/pigeon1.png"),
  require("../../assets/images/avatars/polarbear1.jpg"),
  require("../../assets/images/avatars/sheep1.png"),
];

interface AvatarSectionProps {
  scrollY: Animated.Value;
  avatarScale: Animated.AnimatedInterpolation<number>;
  avatarOpacity: Animated.AnimatedInterpolation<number>;
  avatarTranslateY: Animated.AnimatedInterpolation<number>;
  selectedAvatarIndex: number;
  onAvatarChange: (index: number) => void;
  isOwnProfile?: boolean;
}

export default function AvatarSection({
  scrollY,
  avatarScale,
  avatarOpacity,
  avatarTranslateY,
  selectedAvatarIndex,
  onAvatarChange,
  isOwnProfile = true,
}: AvatarSectionProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const currentAvatar = allAvatars[selectedAvatarIndex];

  const mainAvatarSize = scale(isDesktop ? 80 : 100);
  const mainAvatarRadius = mainAvatarSize / 2;

  const columns = isDesktop ? 5 : 4;
  const currentAvatarItemSize = isDesktop ? scale(55) : AVATAR_SIZE;

  const renderAvatarItem = ({ item, index }: { item: any; index: number }) => (
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
        onAvatarChange(index);
        setShowAvatarSelector(false);
      }}
    >
      <Image
        source={item}
        style={[
          styles.avatarImage,
          {
            width: currentAvatarItemSize,
            height: currentAvatarItemSize,
            borderRadius: currentAvatarItemSize / 2,
            borderWidth: selectedAvatarIndex === index ? 3 : 0,
            borderColor:
              selectedAvatarIndex === index ? colors.primary : "transparent",
          },
        ]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    // DÜZELTME: Tıklama çakışmalarını önlemek için z-index 100'e çekildi ve diğer bileşenlerden tamamen üstte tutuldu.
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
            zIndex: 100, // Çakışmaları garantiye almak için eklendi
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
          onPress={() => isOwnProfile && setShowAvatarSelector(true)}
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
            data={allAvatars}
            renderItem={renderAvatarItem}
            keyExtractor={(_, index) => index.toString()}
            numColumns={columns}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avatarGrid}
            columnWrapperStyle={styles.columnWrapper}
          />
        </BottomSheetModal>
      )}
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
  },
  avatarImage: {},
});
