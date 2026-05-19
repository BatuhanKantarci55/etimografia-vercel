// Banner görsellerini import et

export interface PremiumBanner {
  index: number;
  name: string;
  image: any;
  price: number;
  currency: "gold" | "diamond";
}

// ============= ÜCRETSİZ BANNER'LAR (index 0-19) =============
export const freeBanners = [
  require("../assets/images/banners/free/stars.png"),
  require("../assets/images/banners/free/medusa.png"),
  require("../assets/images/banners/free/pegasus.png"),
  require("../assets/images/banners/free/roses.png"),
  require("../assets/images/banners/free/red_castle.png"),
  require("../assets/images/banners/free/desert.png"),
  require("../assets/images/banners/free/eagle.png"),
  require("../assets/images/banners/free/fairy.png"),
  require("../assets/images/banners/free/fall.png"),
  require("../assets/images/banners/free/flowers.png"),
  require("../assets/images/banners/free/forest.png"),
  require("../assets/images/banners/free/leaves.png"),
  require("../assets/images/banners/free/mountains.png"),
  require("../assets/images/banners/free/ocean.png"),
  require("../assets/images/banners/free/orchid.png"),
  require("../assets/images/banners/free/peacock.png"),
  require("../assets/images/banners/free/phoenix.png"),
  require("../assets/images/banners/free/space.png"),
  require("../assets/images/banners/free/tree.png"),
  require("../assets/images/banners/free/wolf.png"),
];

// Banner isimleri (ücretsiz)
export const freeBannerNames = [
  "Yıldızlar",
  "Medusa",
  "Pegasus",
  "Güller",
  "Kırmızı Kale",
  "Çöl",
  "Çift Başlı Kartal",
  "Mistik Orman",
  "Ağaçlık",
  "Son Kasımpatı",
  "Bahar Ormanı",
  "Dal Girdabı",
  "Yüce Dağlar",
  "Okyanus",
  "Orkide Demeti",
  "Tavus Kuşu Ormanı",
  "Zümrüdüanka",
  "Uzay Manzarası",
  "Yaprak Yığını",
  "Kurt Kanat",
];

// ============= ÜCRETLİ BANNER'LAR (index 100-199) =============
export const premiumBanners: PremiumBanner[] = [
  {
    index: 100,
    name: "Kara Delik",
    image: require("../assets/images/banners/premium/black_hole.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 101,
    name: "Develer",
    image: require("../assets/images/banners/premium/camels.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 102,
    name: "Bahçe",
    image: require("../assets/images/banners/premium/garden.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 103,
    name: "Kore",
    image: require("../assets/images/banners/premium/korea.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 104,
    name: "Sihir",
    image: require("../assets/images/banners/premium/magic.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 105,
    name: "Tavşanlar",
    image: require("../assets/images/banners/premium/rabbits.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 106,
    name: "Sakura",
    image: require("../assets/images/banners/premium/sakura.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 107,
    name: "Samuray",
    image: require("../assets/images/banners/premium/samurai.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 108,
    name: "Satürn",
    image: require("../assets/images/banners/premium/saturn.png"),
    price: 1600,
    currency: "gold",
  },
  {
    index: 109,
    name: "Savaş",
    image: require("../assets/images/banners/premium/war.png"),
    price: 1600,
    currency: "gold",
  },
];

// Tüm banner'lar (ücretsiz + ücretli)
export const allBanners = [
  ...freeBanners,
  ...premiumBanners.map((b) => b.image),
];

// Tüm banner isimleri (ücretsiz + ücretli)
export const allBannerNames = [
  ...freeBannerNames,
  ...premiumBanners.map((b) => b.name),
];

// Banner bilgilerini al (index'e göre)
export const getBannerInfo = (bannerIndex: number) => {
  if (bannerIndex < 100) {
    return {
      isPremium: false,
      name: allBannerNames[bannerIndex] || `Banner ${bannerIndex + 1}`,
      price: 0,
      currency: null,
    };
  } else {
    const premium = premiumBanners.find((b) => b.index === bannerIndex);
    if (premium) {
      return {
        isPremium: true,
        name: premium.name,
        price: premium.price,
        currency: premium.currency,
      };
    }
    return {
      isPremium: false,
      name: "Bilinmeyen Banner",
      price: 0,
      currency: null,
    };
  }
};

export const getBannerSource = (bannerIndex: number) => {
  if (bannerIndex < 100) {
    const index = bannerIndex % freeBanners.length;
    return freeBanners[index];
  } else {
    const premium = premiumBanners.find((b) => b.index === bannerIndex);
    if (premium) {
      return premium.image;
    }
    return freeBanners[0];
  }
};

// Ücretli banner listesini döndür (mağaza için)
export const getPremiumBanners = (): PremiumBanner[] => premiumBanners;
