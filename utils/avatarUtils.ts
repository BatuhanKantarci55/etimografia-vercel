// Avatar görsellerini import et

export interface PremiumAvatar {
  index: number;
  name: string;
  image: any;
  price: number;
  currency: "gold" | "diamond";
}

// ============= ÜCRETSİZ AVATARLAR (index 0-19) =============
export const freeAvatars = [
  require("../assets/images/avatars/free/cat1.jpg"),
  require("../assets/images/avatars/free/cat2.jpg"),
  require("../assets/images/avatars/free/chicken1.png"),
  require("../assets/images/avatars/free/cockatiel1.png"),
  require("../assets/images/avatars/free/cow1.png"),
  require("../assets/images/avatars/free/dolphin1.jpg"),
  require("../assets/images/avatars/free/donkey1.png"),
  require("../assets/images/avatars/free/duck1.png"),
  require("../assets/images/avatars/free/elephant1.jpg"),
  require("../assets/images/avatars/free/fox1.png"),
  require("../assets/images/avatars/free/horse1.png"),
  require("../assets/images/avatars/free/jellyfish1.jpg"),
  require("../assets/images/avatars/free/kakadu1.png"),
  require("../assets/images/avatars/free/octopus1.jpg"),
  require("../assets/images/avatars/free/penguen1.jpg"),
  require("../assets/images/avatars/free/penguen2.jpg"),
  require("../assets/images/avatars/free/pigeon1.png"),
  require("../assets/images/avatars/free/polarbear1.jpg"),
  require("../assets/images/avatars/free/sheep1.png"),
];

// ============= ÜCRETLİ AVATARLAR (index 100-199) =============
export const premiumAvatars: PremiumAvatar[] = [
  {
    index: 100,
    name: "Dişi Deve",
    image: require("../assets/images/avatars/premium/female_camel.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 101,
    name: "Dişi Tavşan",
    image: require("../assets/images/avatars/premium/female_rabbit.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 102,
    name: "Dişi Koyun",
    image: require("../assets/images/avatars/premium/female_sheep.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 103,
    name: "Erkek Deve",
    image: require("../assets/images/avatars/premium/male_camel.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 104,
    name: "Erkek Tavşan",
    image: require("../assets/images/avatars/premium/male_rabbit.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 105,
    name: "Erkek Koyun",
    image: require("../assets/images/avatars/premium/male_sheep.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 106,
    name: "Yaşlı Deve",
    image: require("../assets/images/avatars/premium/old_camel.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 107,
    name: "Yaşlı Tavşan",
    image: require("../assets/images/avatars/premium/old_rabbit.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 108,
    name: "Yaşlı Koyun",
    image: require("../assets/images/avatars/premium/old_sheep.png"),
    price: 800,
    currency: "gold",
  },
  {
    index: 109,
    name: "Uzay Tavşanı",
    image: require("../assets/images/avatars/premium/rabbit_space.png"),
    price: 800,
    currency: "gold",
  },
];

// Tüm avatarlar (ücretsiz + ücretli)
export const allAvatars = [
  ...freeAvatars,
  ...premiumAvatars.map((a) => a.image),
];

// Avatar bilgilerini al (index'e göre)
export const getAvatarInfo = (avatarIndex: number) => {
  if (avatarIndex < 100) {
    return {
      isPremium: false,
      name: `Avatar ${avatarIndex + 1}`,
      price: 0,
      currency: null,
    };
  } else {
    const premium = premiumAvatars.find((a) => a.index === avatarIndex);
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
      name: "Bilinmeyen Avatar",
      price: 0,
      currency: null,
    };
  }
};

export const getAvatarSource = (avatarIndex: number) => {
  if (avatarIndex < 100) {
    const index = avatarIndex % freeAvatars.length;
    return freeAvatars[index];
  } else {
    const premium = premiumAvatars.find((a) => a.index === avatarIndex);
    if (premium) {
      return premium.image;
    }
    return freeAvatars[0];
  }
};

// Ücretli avatar listesini döndür (mağaza için)
export const getPremiumAvatars = (): PremiumAvatar[] => premiumAvatars;
