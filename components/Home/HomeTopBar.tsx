// components/Home/HomeTopBar.tsx
import CustomText from "@components/CustomText";
import { useLevel } from "@contexts/LevelContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface HomeTopBarProps {
  gameMoney: number;
  gameGems: number;
}

export default function HomeTopBar({ gameMoney, gameGems }: HomeTopBarProps) {
  const { colors, themeMode } = useTheme();
  const { levelInfo, loading } = useLevel();
  const { scale, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();

  const [displayLevel, setDisplayLevel] = useState(1);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayTotalScore, setDisplayTotalScore] = useState(0);
  const [displayNextLevelTotal, setDisplayNextLevelTotal] = useState(500);

  useEffect(() => {
    if (levelInfo) {
      setDisplayLevel(levelInfo.level);
      setDisplayProgress(levelInfo.progress);
      setDisplayTotalScore(levelInfo.totalScore);
      setDisplayNextLevelTotal(levelInfo.nextLevelTotalScore);
    }
  }, [levelInfo]);

  // Para ve mücevher renkleri - temaya göre
  const moneyColor = themeMode === "dark" ? "#FFB347" : "#FF8C00";
  const gemColor = themeMode === "dark" ? "#7B68EE" : "#4B0082";

  // Para ve mücevher formatlama
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Masaüstü ve Mobil için Dinamik Ölçüler
  const navbarHeight = scale(isDesktop ? 40 : 70);
  const barHeight = scale(isDesktop ? 28 : 36);
  const boxSize = scale(isDesktop ? 28 : 36);
  const borderRadiusValue = scale(isDesktop ? 8 : 12);

  // Dinamik Font ve İkon Ölçüleri
  const levelFontSize = scale(isDesktop ? 12 : 14);
  const pointsFontSize = scale(isDesktop ? 10 : 13);
  const balanceFontSize = scale(isDesktop ? 11 : 13);
  const addIconSize = scale(isDesktop ? 16 : 20);
  const cashIconSize = scale(isDesktop ? 14 : 18);
  const diamondIconSize = scale(isDesktop ? 13 : 16);
  const sparklesIconSize = scale(isDesktop ? 12 : 16);

  // İçerik hizalamaları için boşluk ayarı
  const leftBoxWidth = isDesktop ? 28 : 40;
  const rightBoxWidth = isDesktop ? 20 : 28;

  return (
    <View
      style={[
        styles.container,
        {
          height: navbarHeight,
          paddingTop: insets.top,
          backgroundColor: colors.card,
          borderBottomWidth: 0,
          justifyContent: "center", // Masaüstünde dikey ortalamak için eklendi
        },
        isDesktop && {
          borderBottomLeftRadius: scale(16),
          borderBottomRightRadius: scale(16),
        },
      ]}
    >
      <View style={[styles.navbarContent, { paddingHorizontal: scale(12) }]}>
        {/* Seviye Barı */}
        <View style={[styles.levelContainer, { flex: 1.6 }]}>
          <View
            style={[
              styles.levelBar,
              {
                backgroundColor: colors.background,
                borderRadius: borderRadiusValue,
                height: barHeight,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              },
            ]}
          >
            {/* Progress Bar (dolum) */}
            <View
              style={[
                styles.levelProgressFill,
                {
                  width: `${displayProgress * 100}%`,
                  backgroundColor: colors.primary + "80",
                  height: "100%",
                  position: "absolute",
                  left: 0,
                  top: 0,
                  borderRadius: borderRadiusValue,
                },
              ]}
            />

            {/* İçerik - Üst katman */}
            <View style={styles.levelContent}>
              {/* Soldaki kutu - seviye numarası */}
              <View
                style={[
                  styles.leftBox,
                  {
                    backgroundColor: colors.primary,
                    width: boxSize,
                    height: boxSize,
                    borderRadius: borderRadiusValue,
                    borderTopLeftRadius: borderRadiusValue,
                    borderBottomLeftRadius: borderRadiusValue,
                    zIndex: 2,
                    position: "absolute",
                    left: 0,
                    top: -1,
                    bottom: 0,
                  },
                ]}
              >
                <CustomText
                  style={[
                    styles.boxText,
                    {
                      color: "white",
                      fontSize: levelFontSize,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {displayLevel}
                </CustomText>
              </View>

              {/* Puan durumu TOPLAM PUAN / HEDEF PUAN formatında */}
              <View
                style={[
                  styles.pointsContainer,
                  { left: scale(leftBoxWidth), right: scale(rightBoxWidth) },
                ]}
              >
                <CustomText
                  style={[
                    styles.pointsText,
                    {
                      color: colors.text,
                      fontSize: pointsFontSize,
                      fontWeight: "500",
                      backgroundColor: "transparent",
                      zIndex: 2,
                    },
                  ]}
                >
                  {formatNumber(displayTotalScore)}/
                  {formatNumber(displayNextLevelTotal)}
                </CustomText>
              </View>

              {/* Sağdaki sparkles ikonu */}
              <View style={styles.rightIconContainer}>
                <Ionicons
                  name="sparkles"
                  size={sparklesIconSize}
                  color={colors.primary}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Oyun Parası */}
        <View style={[styles.balanceContainer, { flex: 1.3 }]}>
          <View
            style={[
              styles.balanceItem,
              {
                backgroundColor: colors.background,
                height: barHeight,
                borderRadius: borderRadiusValue,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 0,
                overflow: "hidden",
              },
            ]}
          >
            <View
              style={[
                styles.leftBox,
                {
                  backgroundColor: moneyColor,
                  width: boxSize,
                  height: boxSize,
                  borderRadius: borderRadiusValue,
                  borderTopLeftRadius: borderRadiusValue,
                  borderBottomLeftRadius: borderRadiusValue,
                  position: "absolute",
                  left: -1,
                  top: -1,
                  zIndex: 2,
                },
              ]}
            >
              <Ionicons name="add" size={addIconSize} color="white" />
            </View>

            <View
              style={[
                styles.balanceAmountContainer,
                { left: scale(leftBoxWidth), right: scale(rightBoxWidth) },
              ]}
            >
              <CustomText
                style={[
                  styles.balanceText,
                  {
                    color: moneyColor,
                    fontSize: balanceFontSize,
                    fontWeight: "600",
                  },
                ]}
              >
                {formatNumber(gameMoney)}
              </CustomText>
            </View>

            <View style={styles.rightIconContainer}>
              <Ionicons
                name="cash-outline"
                size={cashIconSize}
                color={moneyColor}
              />
            </View>
          </View>
        </View>

        {/* Oyun Mücevheri */}
        <View style={[styles.balanceContainer, { flex: 1.1 }]}>
          <View
            style={[
              styles.balanceItem,
              {
                backgroundColor: colors.background,
                height: barHeight,
                borderRadius: borderRadiusValue,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 0,
                overflow: "hidden",
              },
            ]}
          >
            <View
              style={[
                styles.leftBox,
                {
                  backgroundColor: gemColor,
                  width: boxSize,
                  height: boxSize,
                  borderRadius: borderRadiusValue,
                  borderTopLeftRadius: borderRadiusValue,
                  borderBottomLeftRadius: borderRadiusValue,
                  position: "absolute",
                  left: -1,
                  top: -1,
                  zIndex: 2,
                },
              ]}
            >
              <Ionicons name="add" size={addIconSize} color="white" />
            </View>

            <View
              style={[
                styles.balanceAmountContainer,
                { left: scale(leftBoxWidth), right: scale(rightBoxWidth) },
              ]}
            >
              <CustomText
                style={[
                  styles.balanceText,
                  {
                    color: gemColor,
                    fontSize: balanceFontSize,
                    fontWeight: "600",
                  },
                ]}
              >
                {formatNumber(gameGems)}
              </CustomText>
            </View>

            <View style={styles.rightIconContainer}>
              <Ionicons
                name="diamond-outline"
                size={diamondIconSize}
                color={gemColor}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  navbarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  levelContainer: {
    marginRight: 0,
  },
  levelBar: {
    position: "relative",
  },
  levelProgressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  levelContent: {
    flex: 1,
    height: "100%",
    zIndex: 1,
    position: "relative",
  },
  leftBox: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  boxText: {
    fontWeight: "bold",
  },
  pointsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  pointsText: {
    fontWeight: "500",
    textAlign: "center",
  },
  rightIconContainer: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceItem: {
    width: "100%",
    position: "relative",
  },
  balanceAmountContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  balanceText: {
    fontWeight: "600",
    textAlign: "center",
  },
});
