import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useArena } from "@contexts/ArenaContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 40;

interface ArenaListModalProps {
  visible: boolean;
  onClose: () => void;
  currentArenaId: number;
  onSelectArena?: (arenaId: number) => void;
}

export default function ArenaListModal({
  visible,
  onClose,
  currentArenaId,
  onSelectArena,
}: ArenaListModalProps) {
  const { colors, themeMode } = useTheme();
  const { scale } = useResponsive();
  const { arenas, chestProgress, userProgress } = useArena();

  const [selectedIndex, setSelectedIndex] = useState(currentArenaId - 1);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const getArenaImage = (arenaNumber: number) => {
    // Tema bazlı arena görseli seçimi
    if (themeMode === "dark") {
      switch (arenaNumber) {
        case 1:
          return require("@assets/images/arena/arena1-dark.png");
        case 2:
          return require("@assets/images/arena/arena2-dark.png");
        case 3:
          return require("@assets/images/arena/arena3-dark.png");
        case 4:
          return require("@assets/images/arena/arena4-dark.png");
        case 5:
          return require("@assets/images/arena/arena5-dark.png");
        case 6:
          return require("@assets/images/arena/arena6-dark.png");
        case 7:
          return require("@assets/images/arena/arena7-dark.png");
        case 8:
          return require("@assets/images/arena/arena8-dark.png");
        case 9:
          return require("@assets/images/arena/arena9-dark.png");
        case 10:
          return require("@assets/images/arena/arena10-dark.png");
        default:
          return require("@assets/images/arena/arena1-dark.png");
      }
    } else {
      switch (arenaNumber) {
        case 1:
          return require("@assets/images/arena/arena1-light.png");
        case 2:
          return require("@assets/images/arena/arena2-light.png");
        case 3:
          return require("@assets/images/arena/arena3-light.png");
        case 4:
          return require("@assets/images/arena/arena4-light.png");
        case 5:
          return require("@assets/images/arena/arena5-light.png");
        case 6:
          return require("@assets/images/arena/arena6-light.png");
        case 7:
          return require("@assets/images/arena/arena7-light.png");
        case 8:
          return require("@assets/images/arena/arena8-light.png");
        case 9:
          return require("@assets/images/arena/arena9-light.png");
        case 10:
          return require("@assets/images/arena/arena10-light.png");
        default:
          return require("@assets/images/arena/arena1-light.png");
      }
    }
  };

  const isArenaUnlocked = (arenaNumber: number) => {
    if (!userProgress) return arenaNumber === 1;
    const arena = arenas.find((a) => a.arena_number === arenaNumber);
    if (!arena) return false;
    return userProgress.highest_trophies >= arena.min_trophies;
  };

  const getChestStatus = (arenaNumber: number, segmentIndex: number) => {
    const arena = arenas.find((a) => a.arena_number === arenaNumber);
    if (!arena) return "locked";

    const chest = chestProgress.find(
      (c) => c.arena_id === arena.id && c.segment_index === segmentIndex,
    );
    return chest?.status || "locked";
  };

  const getChestIcon = (status: string) => {
    switch (status) {
      case "available":
        return "gift";
      case "opened":
        return "checkmark-circle";
      default:
        return "lock-closed";
    }
  };

  const getChestColor = (status: string) => {
    switch (status) {
      case "available":
        return "#FFD700";
      case "opened":
        return "#4CAF50";
      default:
        return colors.text + "40";
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSelectedIndex(selectedIndex - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleNext = () => {
    if (selectedIndex < arenas.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSelectedIndex(selectedIndex + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const currentArena = arenas[selectedIndex];
  const isUnlocked = isArenaUnlocked(currentArena?.arena_number);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Arenalar"
      height="70%"
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <View style={styles.container}>
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={[
              styles.arrowButton,
              styles.leftArrow,
              {
                backgroundColor: "rgba(0,0,0,0.5)",
                opacity: selectedIndex > 0 ? 1 : 0.3,
              },
            ]}
            onPress={handlePrev}
            disabled={selectedIndex === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={scale(30)} color="white" />
          </TouchableOpacity>

          <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
            <Image
              source={getArenaImage(currentArena?.arena_number || 1)}
              style={styles.arenaImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)"]}
              style={styles.imageGradient}
            />

            {!isUnlocked && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed" size={scale(40)} color="white" />
                <CustomText style={[styles.lockedText, { color: "white" }]}>
                  {currentArena?.min_trophies} Kupa ile açılır
                </CustomText>
              </View>
            )}
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.arrowButton,
              styles.rightArrow,
              {
                backgroundColor: "rgba(0,0,0,0.5)",
                opacity: selectedIndex < arenas.length - 1 ? 1 : 0.3,
              },
            ]}
            onPress={handleNext}
            disabled={selectedIndex === arenas.length - 1}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={scale(30)} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.paginationContainer}>
          {arenas.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === selectedIndex
                      ? colors.primary
                      : colors.text + "20",
                  width: index === selectedIndex ? scale(20) : scale(8),
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.arenaInfo}>
          <CustomText style={[styles.arenaTitle, { color: colors.text }]}>
            {currentArena?.name}
          </CustomText>
          <CustomText
            style={[styles.arenaTrophies, { color: colors.text + "80" }]}
          >
            {currentArena?.min_trophies} - {currentArena?.max_trophies || "∞"}{" "}
            Kupa
          </CustomText>

          {/* 4 Sandık */}
          <View style={styles.chestsContainer}>
            {[0, 1, 2, 3].map((segmentIndex) => {
              const status = getChestStatus(
                currentArena?.arena_number || 1,
                segmentIndex,
              );
              const icon = getChestIcon(status);
              const color = getChestColor(status);

              return (
                <View key={segmentIndex} style={styles.chestItem}>
                  <View
                    style={[
                      styles.chestIconContainer,
                      { backgroundColor: color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={icon as any}
                      size={scale(32)}
                      color={color}
                    />
                  </View>
                  <CustomText
                    style={[
                      styles.chestStatusText,
                      { color: color, fontSize: scale(11) },
                    ]}
                  >
                    {status === "available"
                      ? "Açılabilir"
                      : status === "opened"
                        ? "Açıldı"
                        : "Kilitli"}
                  </CustomText>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageSection: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 9,
    marginTop: 10,
    marginBottom: 20,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  arenaImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lockedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  arenaInfo: {
    width: "100%",
    alignItems: "center",
  },
  arenaTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  arenaTrophies: {
    fontSize: 14,
    marginBottom: 16,
  },
  chestsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  chestItem: {
    alignItems: "center",
  },
  chestIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  chestStatusText: {
    fontWeight: "500",
  },
});
