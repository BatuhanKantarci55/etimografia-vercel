import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface PremiumItem {
  index: number;
  name: string;
  image: any;
  price: number;
  currency: "gold" | "diamond";
}

interface StoreItemCardProps {
  item: PremiumItem;
  isOwned: boolean;
  canAfford: boolean;
  onPurchase: () => void;
}

export default function StoreItemCard({
  item,
  isOwned,
  canAfford,
  onPurchase,
}: StoreItemCardProps) {
  const { colors, themeMode } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const cardWidth = isDesktop ? scale(180) : scale(160);
  const imageSize = isDesktop ? scale(140) : scale(120);

  const currencyColor = item.currency === "gold" ? "#FFB347" : "#7B68EE";
  const currencyIcon =
    item.currency === "gold" ? "cash-outline" : "diamond-outline";

  const getButtonStatus = () => {
    if (isOwned)
      return {
        text: "Satın Alındı",
        disabled: true,
        color: colors.text + "40",
      };
    if (!canAfford)
      return { text: "Yetersiz", disabled: true, color: colors.text + "40" };
    return { text: "Satın Al", disabled: false, color: colors.primary };
  };

  const buttonStatus = getButtonStatus();

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        isOwned && styles.ownedCard,
      ]}
    >
      <View
        style={[styles.imageContainer, { width: imageSize, height: imageSize }]}
      >
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        {isOwned && (
          <View
            style={[styles.ownedBadge, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="checkmark" size={scale(16)} color="white" />
          </View>
        )}
      </View>

      <CustomText
        style={[styles.itemName, { color: colors.text }]}
        numberOfLines={1}
      >
        {item.name}
      </CustomText>

      <View style={styles.priceContainer}>
        <Ionicons name={currencyIcon} size={scale(14)} color={currencyColor} />
        <CustomText style={[styles.priceText, { color: currencyColor }]}>
          {item.price}
        </CustomText>
      </View>

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          {
            backgroundColor: buttonStatus.disabled
              ? buttonStatus.color
              : buttonStatus.color,
            opacity: buttonStatus.disabled ? 0.6 : 1,
          },
        ]}
        onPress={onPurchase}
        disabled={buttonStatus.disabled}
        activeOpacity={0.7}
      >
        <CustomText style={[styles.purchaseButtonText, { color: "white" }]}>
          {buttonStatus.text}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownedCard: {
    opacity: 0.8,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  ownedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  purchaseButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
