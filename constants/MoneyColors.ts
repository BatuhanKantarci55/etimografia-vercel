// constants/MoneyColors.ts
export type ThemeMode = "light" | "dark";

export const moneyColors = {
  gold: {
    light: {
      10: "#FF6B6B", // Kırmızı (en düşük)
      17: "#FF8C42",
      25: "#FFB74D",
      35: "#FFD93D",
      50: "#9CCC65",
      100: "#4CAF50", // Yeşil (en yüksek)
    },
    dark: {
      10: "#FF5252", // Parlak kırmızı
      17: "#FF7043",
      25: "#FFB74D",
      35: "#FFD93D",
      50: "#8BC34A",
      100: "#66BB6A", // Parlak yeşil
    },
  },
  diamond: {
    light: {
      1: "#FF6B6B", // Kırmızı (en düşük)
      2: "#FF8C42",
      3: "#FFB74D",
      5: "#4CAF50", // Yeşil (en yüksek)
    },
    dark: {
      1: "#FF5252", // Parlak kırmızı
      2: "#FF7043",
      3: "#FFB74D",
      5: "#66BB6A", // Parlak yeşil
    },
  },
};

// Değere göre renk seçimi için yardımcı fonksiyon
export const getGoldColor = (value: number, theme: ThemeMode) => {
  const colors = moneyColors.gold[theme];
  switch (value) {
    case 10:
      return colors[10];
    case 17:
      return colors[17];
    case 25:
      return colors[25];
    case 35:
      return colors[35];
    case 50:
      return colors[50];
    case 100:
      return colors[100];
    default:
      return colors[35];
  }
};

export const getDiamondColor = (value: number, theme: ThemeMode) => {
  const colors = moneyColors.diamond[theme];
  switch (value) {
    case 1:
      return colors[1];
    case 2:
      return colors[2];
    case 3:
      return colors[3];
    case 5:
      return colors[5];
    default:
      return colors[3];
  }
};
