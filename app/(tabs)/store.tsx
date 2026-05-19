// app/(tabs)/store.tsx
import BackgroundImage from "@components/BackgroundImage";
import CustomText from "@components/CustomText";
import HomeTopBar from "@components/Home/HomeTopBar";
import { useAuth } from "@contexts/AuthContext";
import { useCurrency } from "@contexts/CurrencyContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { supabase } from "@lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { getPremiumAvatars } from "@utils/avatarUtils";
import { getPremiumBanners } from "@utils/bannerUtils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Altın Paketi Tipi
interface GoldPackage {
  diamondCost: number;
  goldAmount: number;
}

const goldPackages: GoldPackage[] = [
  { diamondCost: 1, goldAmount: 10 },
  { diamondCost: 5, goldAmount: 60 },
  { diamondCost: 10, goldAmount: 140 },
  { diamondCost: 25, goldAmount: 400 },
];

// Altın Paketi Kartı (Avatar kartı gibi görünümlü)
const GoldPackageCard = React.memo(
  ({ item, canAfford, onPurchase, colors }: any) => {
    const { scale, isDesktop } = useResponsive();
    const cardWidth = isDesktop ? scale(180) : (SCREEN_WIDTH - 48) / 2;
    const imageSize = isDesktop ? scale(160) : cardWidth - 24;

    return (
      <View
        style={[
          styles.goldPackageCard,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.goldPackageImageContainer,
            { width: imageSize, height: imageSize },
          ]}
        >
          <View
            style={[
              styles.goldPackageIcon,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons name="cash-outline" size={scale(40)} color="#FFB347" />
          </View>
        </View>

        <View style={styles.goldPackageExchange}>
          <View style={styles.goldPackageCost}>
            <Ionicons name="diamond-outline" size={14} color="#7B68EE" />
            <CustomText
              style={[styles.goldPackageCostText, { color: "#7B68EE" }]}
            >
              {item.diamondCost}
            </CustomText>
          </View>
          <Ionicons name="arrow-forward" size={12} color={colors.text + "60"} />
          <View style={styles.goldPackageReward}>
            <Ionicons name="cash-outline" size={14} color="#FFB347" />
            <CustomText
              style={[styles.goldPackageRewardText, { color: "#FFB347" }]}
            >
              {item.goldAmount}
            </CustomText>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.goldPurchaseButton,
            {
              backgroundColor: canAfford ? colors.primary : colors.text + "40",
            },
          ]}
          onPress={onPurchase}
          disabled={!canAfford}
          activeOpacity={0.7}
        >
          <CustomText
            style={[styles.goldPurchaseButtonText, { color: "white" }]}
          >
            {canAfford ? "Satın Al" : "Yetersiz"}
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  },
);

// Banner Kartı
const BannerCard = React.memo(
  ({ item, isOwned, canAfford, onPurchase, colors }: any) => {
    const { scale, isDesktop } = useResponsive();
    const cardWidth = isDesktop ? SCREEN_WIDTH * 0.35 : SCREEN_WIDTH - 32;
    const imageHeight = isDesktop ? scale(120) : 120;

    const currencyColor = item.currency === "gold" ? "#FFB347" : "#7B68EE";
    const currencyIcon =
      item.currency === "gold" ? "cash-outline" : "diamond-outline";

    const buttonStatus = useMemo(() => {
      if (isOwned)
        return {
          text: "Satın Alındı",
          disabled: true,
          bgColor: colors.text + "40",
        };
      if (!canAfford)
        return {
          text: "Yetersiz",
          disabled: true,
          bgColor: colors.text + "40",
        };
      return { text: "Satın Al", disabled: false, bgColor: colors.primary };
    }, [isOwned, canAfford, colors]);

    return (
      <View
        style={[
          styles.bannerCard,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          isOwned && styles.ownedCard,
        ]}
      >
        <View style={[styles.bannerImageContainer, { height: imageHeight }]}>
          <Image
            source={item.image}
            style={styles.bannerImage}
            resizeMode="cover"
            fadeDuration={200}
          />
          {isOwned && (
            <View
              style={[styles.ownedBadge, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
        </View>

        <View style={styles.bannerInfo}>
          <CustomText
            style={[styles.itemName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </CustomText>

          <View style={styles.priceContainer}>
            <Ionicons name={currencyIcon} size={14} color={currencyColor} />
            <CustomText style={[styles.priceText, { color: currencyColor }]}>
              {item.price}
            </CustomText>
          </View>

          <TouchableOpacity
            style={[
              styles.purchaseButton,
              {
                backgroundColor: buttonStatus.bgColor,
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
      </View>
    );
  },
);

// Avatar Kartı
const AvatarCard = React.memo(
  ({ item, isOwned, canAfford, onPurchase, colors }: any) => {
    const { scale, isDesktop } = useResponsive();
    const cardWidth = isDesktop ? scale(180) : (SCREEN_WIDTH - 48) / 2;
    const imageSize = isDesktop ? scale(160) : cardWidth - 24;

    const currencyColor = item.currency === "gold" ? "#FFB347" : "#7B68EE";
    const currencyIcon =
      item.currency === "gold" ? "cash-outline" : "diamond-outline";

    const buttonStatus = useMemo(() => {
      if (isOwned)
        return {
          text: "Satın Alındı",
          disabled: true,
          bgColor: colors.text + "40",
        };
      if (!canAfford)
        return {
          text: "Yetersiz",
          disabled: true,
          bgColor: colors.text + "40",
        };
      return { text: "Satın Al", disabled: false, bgColor: colors.primary };
    }, [isOwned, canAfford, colors]);

    return (
      <View
        style={[
          styles.avatarCard,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          isOwned && styles.ownedCard,
        ]}
      >
        <View
          style={[
            styles.avatarImageContainer,
            { width: imageSize, height: imageSize },
          ]}
        >
          <Image
            source={item.image}
            style={styles.avatarImage}
            resizeMode="cover"
            fadeDuration={200}
          />
          {isOwned && (
            <View
              style={[styles.ownedBadge, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={16} color="white" />
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
          <Ionicons name={currencyIcon} size={14} color={currencyColor} />
          <CustomText style={[styles.priceText, { color: currencyColor }]}>
            {item.price}
          </CustomText>
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            {
              backgroundColor: buttonStatus.bgColor,
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
  },
);

// Satın Alma Onay Modalı
const ConfirmPurchaseModal = ({
  visible,
  onClose,
  onConfirm,
  item,
  colors,
  type,
}: any) => {
  const { scale } = useResponsive();

  const getContent = () => {
    if (type === "gold") {
      return (
        <>
          <CustomText
            style={[
              styles.confirmModalMessage,
              { color: colors.text + "CC", textAlign: "center" },
            ]}
          >
            {item.diamondCost} Elmas harcayarak {item.goldAmount} Altın satın
            almak istediğinize emin misiniz?
          </CustomText>
          <View style={styles.confirmPriceContainer}>
            <Ionicons name="diamond-outline" size={scale(16)} color="#7B68EE" />
            <CustomText style={[styles.confirmPriceText, { color: "#7B68EE" }]}>
              {item.diamondCost} Elmas
            </CustomText>
            <Ionicons
              name="arrow-forward"
              size={scale(14)}
              color={colors.text + "60"}
            />
            <Ionicons name="cash-outline" size={scale(16)} color="#FFB347" />
            <CustomText style={[styles.confirmPriceText, { color: "#FFB347" }]}>
              {item.goldAmount} Altın
            </CustomText>
          </View>
        </>
      );
    }

    const currencyColor = item?.currency === "gold" ? "#FFB347" : "#7B68EE";
    const currencyIcon =
      item?.currency === "gold" ? "cash-outline" : "diamond-outline";

    return (
      <>
        <CustomText
          style={[
            styles.confirmModalMessage,
            { color: colors.text + "CC", textAlign: "center" },
          ]}
        >
          {item?.name} ürününü satın almak istediğinize emin misiniz?
        </CustomText>
        <View style={styles.confirmPriceContainer}>
          <Ionicons
            name={currencyIcon}
            size={scale(16)}
            color={currencyColor}
          />
          <CustomText
            style={[styles.confirmPriceText, { color: currencyColor }]}
          >
            {item?.price} {item?.currency === "gold" ? "Altın" : "Elmas"}
          </CustomText>
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.confirmModalContainer,
            {
              backgroundColor: colors.card,
              borderRadius: scale(12),
              padding: scale(20),
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <CustomText
            style={[
              styles.confirmModalTitle,
              { color: colors.text, textAlign: "center", marginBottom: 16 },
            ]}
          >
            Satın Almayı Onayla
          </CustomText>

          <View style={styles.confirmModalContent}>{getContent()}</View>

          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                { backgroundColor: colors.text + "20" },
              ]}
              onPress={onClose}
            >
              <CustomText
                style={[styles.confirmModalButtonText, { color: colors.text }]}
              >
                İptal
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={onConfirm}
            >
              <CustomText
                style={[styles.confirmModalButtonText, { color: "white" }]}
              >
                Satın Al
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Mağaza Yenileme Onay Modalı
const RefreshStoreModal = ({ visible, onClose, onConfirm, colors }: any) => {
  const { scale } = useResponsive();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.confirmModalContainer,
            {
              backgroundColor: colors.card,
              borderRadius: scale(12),
              padding: scale(20),
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <CustomText
            style={[
              styles.confirmModalTitle,
              { color: colors.text, textAlign: "center", marginBottom: 16 },
            ]}
          >
            Mağazayı Yenile
          </CustomText>

          <View style={styles.confirmModalContent}>
            <CustomText
              style={[
                styles.confirmModalMessage,
                { color: colors.text + "CC", textAlign: "center" },
              ]}
            >
              Mağaza ürünlerini yenilemek istediğinize emin misiniz?
            </CustomText>
            <CustomText
              style={[
                styles.confirmModalSubMessage,
                {
                  color: colors.text + "60",
                  textAlign: "center",
                  marginTop: 8,
                },
              ]}
            >
              Bu işlem mevcut ürünleri değiştirecektir.
            </CustomText>
          </View>

          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                { backgroundColor: colors.text + "20" },
              ]}
              onPress={onClose}
            >
              <CustomText
                style={[styles.confirmModalButtonText, { color: colors.text }]}
              >
                İptal
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmModalButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={onConfirm}
            >
              <CustomText
                style={[styles.confirmModalButtonText, { color: "white" }]}
              >
                Yenile
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function StoreScreen() {
  const { colors, themeMode } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { user } = useAuth();
  const { currencies, refresh: refreshCurrency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasedAvatars, setPurchasedAvatars] = useState<Set<number>>(
    new Set(),
  );
  const [purchasedBanners, setPurchasedBanners] = useState<Set<number>>(
    new Set(),
  );
  const [dailyAvatars, setDailyAvatars] = useState<number[]>([]);
  const [dailyBanners, setDailyBanners] = useState<number[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);

  // Onay modalı state'leri
  const [confirmPurchaseVisible, setConfirmPurchaseVisible] = useState(false);
  const [confirmRefreshVisible, setConfirmRefreshVisible] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{
    item: any;
    type: "avatar" | "banner" | "gold";
  } | null>(null);

  const lastRefreshTime = useRef(0);
  const isMounted = useRef(true);
  const isDataLoaded = useRef(false);

  // Admin kontrolü
  const checkIsAdmin = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("is_admin", {
        user_id: user.id,
      });
      if (error) throw error;
      if (isMounted.current) setIsAdmin(!!data);
    } catch (error) {
      console.error("Admin kontrolü hatası:", error);
      if (isMounted.current) setIsAdmin(false);
    }
  }, [user]);

  // Kullanıcının satın aldığı ürünleri getir
  const fetchUserPurchases = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_purchases")
        .select("item_type, item_index")
        .eq("user_id", user.id);

      if (error) throw error;

      const avatars = new Set<number>();
      const banners = new Set<number>();

      data?.forEach((item) => {
        if (item.item_type === "avatar") avatars.add(item.item_index);
        else if (item.item_type === "banner") banners.add(item.item_index);
      });

      if (isMounted.current) {
        setPurchasedAvatars(avatars);
        setPurchasedBanners(banners);
      }
    } catch (error) {
      console.error("Satın alınan ürünler yüklenirken hata:", error);
    }
  }, [user]);

  // Günlük mağaza ürünlerini getir
  const fetchDailyStoreItems = useCallback(async (skipCache = false) => {
    if (isDataLoaded.current && !skipCache) {
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("daily_store_items")
        .select("item_type, item_index")
        .eq("display_date", today);

      if (error) throw error;

      const avatars: number[] = [];
      const banners: number[] = [];

      data?.forEach((item) => {
        if (item.item_type === "avatar") avatars.push(item.item_index);
        else if (item.item_type === "banner") banners.push(item.item_index);
      });

      if (avatars.length === 0) {
        const premiumAvatars = getPremiumAvatars();
        if (isMounted.current)
          setDailyAvatars(premiumAvatars.slice(0, 4).map((a) => a.index));
      } else {
        if (isMounted.current) setDailyAvatars(avatars);
      }

      if (banners.length === 0) {
        const premiumBanners = getPremiumBanners();
        if (isMounted.current)
          setDailyBanners(premiumBanners.slice(0, 4).map((b) => b.index));
      } else {
        if (isMounted.current) setDailyBanners(banners);
      }

      isDataLoaded.current = true;
    } catch (error) {
      console.error("Günlük mağaza ürünleri yüklenirken hata:", error);
      const premiumAvatars = getPremiumAvatars();
      const premiumBanners = getPremiumBanners();
      if (isMounted.current) {
        setDailyAvatars(premiumAvatars.slice(0, 4).map((a) => a.index));
        setDailyBanners(premiumBanners.slice(0, 4).map((b) => b.index));
      }
    }
  }, []);

  // Tüm verileri yenile (pull to refresh için)
  const refreshAllData = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < 3000) {
      return;
    }
    lastRefreshTime.current = now;

    setRefreshing(true);
    try {
      isDataLoaded.current = false;
      await Promise.all([fetchDailyStoreItems(true), fetchUserPurchases()]);
    } catch (error: any) {
      console.error("Veri yenileme hatası:", error);
      Alert.alert(
        "Hata",
        `Veriler yenilenirken bir sorun oluştu.\n${error.message || "Bilinmeyen hata"}`,
      );
    } finally {
      if (isMounted.current) setRefreshing(false);
    }
  }, [fetchDailyStoreItems, fetchUserPurchases]);

  // Admin butonu ile mağaza yenileme (onay sonrası)
  const executeAdminRefresh = useCallback(async () => {
    setConfirmRefreshVisible(false);
    setRefreshing(true);
    try {
      const { error } = await supabase.rpc("refresh_store_items");
      if (error) throw error;

      isDataLoaded.current = false;
      await fetchDailyStoreItems(true);
      Alert.alert("Başarılı", "Mağaza ürünleri yenilendi!");
    } catch (error: any) {
      console.error("Mağaza yenileme hatası:", error);
      Alert.alert(
        "Hata",
        `Mağaza yenilenirken bir sorun oluştu.\n${error.message || "Bilinmeyen hata"}`,
      );
    } finally {
      if (isMounted.current) setRefreshing(false);
    }
  }, [fetchDailyStoreItems]);

  // Admin yenileme butonuna tıklandığında onay modalını göster
  const handleAdminRefreshRequest = useCallback(() => {
    if (!isAdmin) return;
    setConfirmRefreshVisible(true);
  }, [isAdmin]);

  // Tüm ürünleri görme moduna geç
  const handleShowAllItems = useCallback(() => {
    setShowAllItems(true);
  }, []);

  // Normal mağaza görünümüne dön
  const handleShowStoreItems = useCallback(() => {
    setShowAllItems(false);
  }, []);

  // Pull to refresh için
  const handlePullToRefresh = useCallback(async () => {
    await refreshAllData();
  }, [refreshAllData]);

  // Altın satın alma işlemini gerçekleştir
  const executeGoldPurchase = useCallback(
    async (goldPackage: GoldPackage) => {
      if (!user) return;

      const newGold = (currencies?.gold || 0) + goldPackage.goldAmount;
      const newDiamond = (currencies?.diamond || 0) - goldPackage.diamondCost;

      try {
        const { error: updateError } = await supabase
          .from("user_currencies")
          .update({
            gold: newGold,
            diamond: newDiamond,
            updated_at: new Date(),
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        await refreshCurrency();
        Alert.alert(
          "Başarılı",
          `${goldPackage.goldAmount} Altın satın alındı!`,
        );
      } catch (error) {
        console.error("Altın satın alma hatası:", error);
        Alert.alert("Hata", "Altın satın alınırken bir hata oluştu.");
      }
    },
    [user, currencies, refreshCurrency],
  );

  // Satın alma işlemini gerçekleştir (onay sonrası)
  const executePurchase = useCallback(async () => {
    if (!pendingPurchase) return;

    const { item, type } = pendingPurchase;
    setConfirmPurchaseVisible(false);

    try {
      if (type === "gold") {
        await executeGoldPurchase(item as GoldPackage);
      } else {
        const { error: purchaseError } = await supabase
          .from("user_purchases")
          .insert({
            user_id: user!.id,
            item_type: type,
            item_index: item.index,
          });

        if (purchaseError) throw purchaseError;

        if (item.currency === "gold") {
          const { error: updateError } = await supabase
            .from("user_currencies")
            .update({ gold: (currencies?.gold || 0) - item.price })
            .eq("user_id", user!.id);
          if (updateError) throw updateError;
        } else {
          const { error: updateError } = await supabase
            .from("user_currencies")
            .update({ diamond: (currencies?.diamond || 0) - item.price })
            .eq("user_id", user!.id);
          if (updateError) throw updateError;
        }

        await refreshCurrency();
        await fetchUserPurchases();
        Alert.alert("Başarılı", `${item.name} satın alındı!`);
      }
    } catch (error) {
      console.error("Satın alma hatası:", error);
      Alert.alert("Hata", "Satın alma işlemi sırasında bir hata oluştu.");
    } finally {
      setPendingPurchase(null);
    }
  }, [
    pendingPurchase,
    user,
    currencies,
    refreshCurrency,
    fetchUserPurchases,
    executeGoldPurchase,
  ]);

  // Satın alma butonuna tıklandığında onay modalını göster
  const handlePurchaseRequest = useCallback(
    (item: any, type: "avatar" | "banner" | "gold") => {
      if (!user) {
        Alert.alert("Giriş Yapın", "Satın almak için giriş yapmalısınız.");
        return;
      }

      if (type === "gold") {
        const goldPackage = item as GoldPackage;
        const hasEnough = (currencies?.diamond || 0) >= goldPackage.diamondCost;
        if (!hasEnough) {
          Alert.alert(
            "Yetersiz Bakiye",
            `Yeterli elmas bakiyeniz yok. Bu işlem için ${goldPackage.diamondCost} elmas gerekiyor.`,
          );
          return;
        }
        setPendingPurchase({ item, type });
        setConfirmPurchaseVisible(true);
      } else {
        const hasEnough =
          item.currency === "gold"
            ? (currencies?.gold || 0) >= item.price
            : (currencies?.diamond || 0) >= item.price;

        if (!hasEnough) {
          Alert.alert(
            "Yetersiz Bakiye",
            `Yeterli ${item.currency === "gold" ? "altın" : "elmas"} bakiyeniz yok.`,
          );
          return;
        }
        setPendingPurchase({ item, type });
        setConfirmPurchaseVisible(true);
      }
    },
    [user, currencies],
  );

  // Tüm verileri yükle (sadece ilk mount'ta)
  const loadAllData = useCallback(async () => {
    if (!isInitialLoad) return;

    setLoading(true);
    await Promise.all([
      fetchUserPurchases(),
      fetchDailyStoreItems(),
      checkIsAdmin(),
    ]);
    if (isMounted.current) {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [fetchUserPurchases, fetchDailyStoreItems, checkIsAdmin, isInitialLoad]);

  // Sadece ilk mount'ta yükle
  useEffect(() => {
    isMounted.current = true;
    loadAllData();

    return () => {
      isMounted.current = false;
    };
  }, [loadAllData]);

  // Sekme odaklandığında sadece satın alınan ürünleri güncelle
  useFocusEffect(
    useCallback(() => {
      if (!isInitialLoad && user) {
        fetchUserPurchases();
      }
    }, [user, fetchUserPurchases, isInitialLoad]),
  );

  // AppState değiştiğinde (sekme değişimi) sadece satın alınan ürünleri güncelle
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && !isInitialLoad && user) {
        fetchUserPurchases();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, fetchUserPurchases, isInitialLoad]);

  // Paketler Bölümü (Avatar kartları gibi 2x2 grid)
  const renderPackages = useCallback(() => {
    // Paketleri 2'şerli gruplara ayır
    const rows = [];
    for (let i = 0; i < goldPackages.length; i += 2) {
      rows.push(goldPackages.slice(i, i + 2));
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.line, { backgroundColor: colors.text }]} />
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Paketler
          </CustomText>
          <View style={[styles.line, { backgroundColor: colors.text }]} />
        </View>

        <View style={styles.avatarsGrid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.avatarRow}>
              {row.map((item, idx) => (
                <GoldPackageCard
                  key={idx}
                  item={item}
                  canAfford={(currencies?.diamond || 0) >= item.diamondCost}
                  onPurchase={() => handlePurchaseRequest(item, "gold")}
                  colors={colors}
                />
              ))}
              {row.length === 1 && (
                <View style={{ width: (SCREEN_WIDTH - 48) / 2 }} />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }, [currencies, colors, handlePurchaseRequest]);

  // Tüm ürünleri göster (admin için)
  const renderAllItems = useCallback(() => {
    const allAvatars = getPremiumAvatars();
    const allBannersList = getPremiumBanners();

    const avatarRows = [];
    for (let i = 0; i < allAvatars.length; i += 2) {
      avatarRows.push(allAvatars.slice(i, i + 2));
    }

    const canAfford = (price: number, currency: "gold" | "diamond") => {
      if (currency === "gold") return (currencies?.gold || 0) >= price;
      return (currencies?.diamond || 0) >= price;
    };

    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              Tüm Flamalar
            </CustomText>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
          </View>

          <View style={styles.bannersContainer}>
            {allBannersList.map((item) => (
              <BannerCard
                key={item.index}
                item={item}
                isOwned={purchasedBanners.has(item.index)}
                canAfford={canAfford(item.price, item.currency)}
                onPurchase={() => handlePurchaseRequest(item, "banner")}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              Tüm Avatarlar
            </CustomText>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
          </View>

          <View style={styles.avatarsGrid}>
            {avatarRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.avatarRow}>
                {row.map((item) => (
                  <AvatarCard
                    key={item.index}
                    item={item}
                    isOwned={purchasedAvatars.has(item.index)}
                    canAfford={canAfford(item.price, item.currency)}
                    onPurchase={() => handlePurchaseRequest(item, "avatar")}
                    colors={colors}
                  />
                ))}
                {row.length === 1 && (
                  <View style={{ width: (SCREEN_WIDTH - 48) / 2 }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {renderPackages()}
      </>
    );
  }, [
    purchasedAvatars,
    purchasedBanners,
    currencies,
    colors,
    handlePurchaseRequest,
    renderPackages,
  ]);

  // Normal mağaza ürünlerini göster (Paketler en altta)
  const renderStoreItems = useCallback(() => {
    const premiumBannersList = getPremiumBanners();
    const bannersToShow = dailyBanners
      .map((index) => premiumBannersList.find((b) => b.index === index))
      .filter(Boolean);

    const premiumAvatarsList = getPremiumAvatars();
    const avatarsToShow = dailyAvatars
      .map((index) => premiumAvatarsList.find((a) => a.index === index))
      .filter(Boolean);

    const avatarRows = [];
    for (let i = 0; i < avatarsToShow.length; i += 2) {
      avatarRows.push(avatarsToShow.slice(i, i + 2));
    }

    const canAfford = (price: number, currency: "gold" | "diamond") => {
      if (currency === "gold") return (currencies?.gold || 0) >= price;
      return (currencies?.diamond || 0) >= price;
    };

    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              Flamalar
            </CustomText>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
          </View>

          <View style={styles.bannersContainer}>
            {bannersToShow.map((item) => (
              <BannerCard
                key={item!.index}
                item={item!}
                isOwned={purchasedBanners.has(item!.index)}
                canAfford={canAfford(item!.price, item!.currency)}
                onPurchase={() => handlePurchaseRequest(item!, "banner")}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
            <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
              Avatarlar
            </CustomText>
            <View style={[styles.line, { backgroundColor: colors.text }]} />
          </View>

          <View style={styles.avatarsGrid}>
            {avatarRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.avatarRow}>
                {row.map((item) => (
                  <AvatarCard
                    key={item!.index}
                    item={item!}
                    isOwned={purchasedAvatars.has(item!.index)}
                    canAfford={canAfford(item!.price, item!.currency)}
                    onPurchase={() => handlePurchaseRequest(item!, "avatar")}
                    colors={colors}
                  />
                ))}
                {row.length === 1 && (
                  <View style={{ width: (SCREEN_WIDTH - 48) / 2 }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {renderPackages()}
      </>
    );
  }, [
    dailyBanners,
    dailyAvatars,
    purchasedBanners,
    purchasedAvatars,
    currencies,
    colors,
    handlePurchaseRequest,
    renderPackages,
  ]);

  const content = (
    <View style={styles.container}>
      <HomeTopBar />

      {/* Admin Butonları */}
      {isAdmin && (
        <View style={styles.adminButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.adminButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleAdminRefreshRequest}
            disabled={refreshing}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <CustomText
              style={[styles.adminButtonText, { color: colors.primary }]}
            >
              Mağazayı Yenile
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.adminButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={showAllItems ? handleShowStoreItems : handleShowAllItems}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showAllItems ? "grid-outline" : "list-outline"}
              size={20}
              color={colors.primary}
            />
            <CustomText
              style={[styles.adminButtonText, { color: colors.primary }]}
            >
              {showAllItems ? "Mağaza Görünümü" : "Tüm Ürünler"}
            </CustomText>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === "android"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullToRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Yenileniyor..."
            titleColor={colors.text}
          />
        }
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : showAllItems ? (
          renderAllItems()
        ) : (
          renderStoreItems()
        )}
      </ScrollView>

      {/* Satın Alma Onay Modalı */}
      <ConfirmPurchaseModal
        visible={confirmPurchaseVisible}
        onClose={() => {
          setConfirmPurchaseVisible(false);
          setPendingPurchase(null);
        }}
        onConfirm={executePurchase}
        item={pendingPurchase?.item}
        type={pendingPurchase?.type}
        colors={colors}
      />

      {/* Mağaza Yenileme Onay Modalı */}
      <RefreshStoreModal
        visible={confirmRefreshVisible}
        onClose={() => setConfirmRefreshVisible(false)}
        onConfirm={executeAdminRefresh}
        colors={colors}
      />
    </View>
  );

  if (isDesktop) {
    return (
      <View
        style={{ flex: 1, maxWidth: 800, alignSelf: "center", width: "100%" }}
      >
        {content}
      </View>
    );
  }

  return <BackgroundImage overlayOpacity={0.03}>{content}</BackgroundImage>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  adminButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  adminButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
  // Altın Paketleri Stilleri (Avatar kartı gibi)
  goldPackageCard: {
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
  goldPackageImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  goldPackageIcon: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  goldPackageExchange: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  goldPackageCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goldPackageCostText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  goldPackageReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goldPackageRewardText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  goldPurchaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  goldPurchaseButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Banner ve Avatar Stilleri
  bannersContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  bannerCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerImageContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerInfo: {
    padding: 12,
    alignItems: "center",
  },
  avatarsGrid: {
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  avatarCard: {
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
  avatarImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  ownedCard: {
    opacity: 0.8,
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
  // Onay Modal Stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContainer: {
    width: "80%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  confirmModalContent: {
    marginBottom: 20,
  },
  confirmModalMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  confirmModalSubMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  confirmPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  confirmPriceText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmModalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
  },
  confirmModalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
