import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useCurrency } from "@contexts/CurrencyContext";
import { useLevel } from "@contexts/LevelContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LevelRewardsModal from "../../components/LevelRewardsModal";

export default function HomeTopBar() {
  const { colors, themeMode } = useTheme();
  const { user } = useAuth();
  const { levelInfo, loading: levelLoading } = useLevel();
  const { currencies, loading: currencyLoading } = useCurrency();
  const { scale, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);

  const displayLevel = levelInfo?.level || 1;
  const displayProgress = levelInfo?.progress || 0;
  const displayTotalScore = levelInfo?.totalScore || 0;
  const displayNextLevelTotal = levelInfo?.nextLevelTotalScore || 500;

  const goldAmount = currencies?.gold ?? 0;
  const diamondAmount = currencies?.diamond ?? 0;

  // Tema renkleri
  const moneyColor = themeMode === "dark" ? "#FFB347" : "#FF8C00";
  const gemColor = themeMode === "dark" ? "#7B68EE" : "#4B0082";

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const navbarHeight = scale(isDesktop ? 40 : 70);
  const barHeight = scale(isDesktop ? 28 : 36);
  const boxSize = scale(isDesktop ? 28 : 36);
  const borderRadiusValue = scale(isDesktop ? 8 : 12);

  const levelFontSize = scale(isDesktop ? 12 : 14);
  const pointsFontSize = scale(isDesktop ? 10 : 13);
  const balanceFontSize = scale(isDesktop ? 11 : 13);
  const addIconSize = scale(isDesktop ? 16 : 20);
  const cashIconSize = scale(isDesktop ? 14 : 18);
  const diamondIconSize = scale(isDesktop ? 13 : 16);
  const sparklesIconSize = scale(isDesktop ? 12 : 16);

  const leftBoxWidth = isDesktop ? 28 : 40;
  const rightBoxWidth = isDesktop ? 20 : 28;

  const handleLevelBarPress = () => {
    if (user) {
      setModalVisible(true);
    }
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            height: navbarHeight,
            paddingTop: insets.top,
            backgroundColor: colors.card,
            borderBottomWidth: 0,
            justifyContent: "center",
          },
          isDesktop && {
            borderBottomLeftRadius: scale(16),
            borderBottomRightRadius: scale(16),
          },
        ]}
      >
        <View style={[styles.navbarContent, { paddingHorizontal: scale(12) }]}>
          {/* Seviye Barı - Tıklanabilir */}
          <TouchableOpacity
            style={[styles.levelContainer, { flex: 1.6 }]}
            onPress={handleLevelBarPress}
            activeOpacity={0.7}
          >
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
              {/* Progress Bar */}
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

              {/* İçerik */}
              <View style={styles.levelContent}>
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

                <View style={styles.rightIconContainer}>
                  <Ionicons
                    name="sparkles"
                    size={sparklesIconSize}
                    color={colors.primary}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Oyun Parası (Altın) */}
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
                  {formatNumber(goldAmount)}
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

          {/* Oyun Mücevheri (Elmas) */}
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
                  {formatNumber(diamondAmount)}
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

      <LevelRewardsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
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
