import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { getPremiumAvatars, PremiumAvatar } from "@utils/avatarUtils";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import StoreItemCard from "./StoreItemCard";

interface AvatarsSectionProps {
  purchasedAvatars: Set<number>;
  currencies: { gold: number; diamond: number };
  onPurchase: (item: PremiumAvatar) => void;
  dailyAvatars?: number[];
}

export default function AvatarsSection({
  purchasedAvatars,
  currencies,
  onPurchase,
  dailyAvatars,
}: AvatarsSectionProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  // Günlük seçilen avatar'ları al
  const premiumAvatars = getPremiumAvatars();
  const displayedAvatars: PremiumAvatar[] = dailyAvatars
    ? dailyAvatars
        .map((index) => premiumAvatars.find((a) => a.index === index))
        .filter((a): a is PremiumAvatar => a !== undefined)
    : premiumAvatars.slice(0, 4);

  const canAfford = (price: number, currency: "gold" | "diamond") => {
    if (currency === "gold") return currencies.gold >= price;
    return currencies.diamond >= price;
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Avatarlar
        </CustomText>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayedAvatars.map((item) => (
          <StoreItemCard
            key={item.index}
            item={item}
            isOwned={purchasedAvatars.has(item.index)}
            canAfford={canAfford(item.price, item.currency)}
            onPurchase={() => onPurchase(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
