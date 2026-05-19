import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { getAvatarSource } from "@utils/avatarUtils";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface UserAvatarSectionProps {
  scrollY: Animated.Value;
  avatarScale: Animated.AnimatedInterpolation<number>;
  avatarOpacity: Animated.AnimatedInterpolation<number>;
  avatarTranslateY: Animated.AnimatedInterpolation<number>;
  avatarIndex: number;
}

export default function UserAvatarSection({
  scrollY,
  avatarScale,
  avatarOpacity,
  avatarTranslateY,
  avatarIndex,
}: UserAvatarSectionProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const currentAvatar = getAvatarSource(avatarIndex);

  const mainAvatarSize = scale(isDesktop ? 80 : 100);
  const mainAvatarRadius = mainAvatarSize / 2;

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
        <View
          style={[
            styles.avatarTouchable,
            {
              width: mainAvatarSize,
              height: mainAvatarSize,
              borderRadius: mainAvatarRadius,
            },
          ]}
        >
          <Image
            source={currentAvatar}
            style={[
              styles.avatarImage,
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
        </View>
      </Animated.View>
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
  avatarImage: {},
});
