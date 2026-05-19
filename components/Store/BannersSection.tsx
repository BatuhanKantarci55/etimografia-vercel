import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { getPremiumBanners, PremiumBanner } from "@utils/bannerUtils";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import StoreItemCard from "./StoreItemCard";

interface BannersSectionProps {
  purchasedBanners: Set<number>;
  currencies: { gold: number; diamond: number };
  onPurchase: (item: PremiumBanner) => void;
  dailyBanners?: number[];
}

export default function BannersSection({
  purchasedBanners,
  currencies,
  onPurchase,
  dailyBanners,
}: BannersSectionProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  // Günlük seçilen banner'ları al
  const premiumBanners = getPremiumBanners();
  const displayedBanners: PremiumBanner[] = dailyBanners
    ? dailyBanners
        .map((index) => premiumBanners.find((b) => b.index === index))
        .filter((b): b is PremiumBanner => b !== undefined)
    : premiumBanners.slice(0, 4);

  const canAfford = (price: number, currency: "gold" | "diamond") => {
    if (currency === "gold") return currencies.gold >= price;
    return currencies.diamond >= price;
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
          Flamalar
        </CustomText>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayedBanners.map((item) => (
          <StoreItemCard
            key={item.index}
            item={item}
            isOwned={purchasedBanners.has(item.index)}
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
