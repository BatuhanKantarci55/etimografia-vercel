export type ThemeMode = "light" | "dark";
export type AppMode = "education" | "practice" | "competition" | "event";

// Tema renk paletleri
export const colorSchemes = {
  // EĞİTİM MODU - MAVİ
  education: {
    light: {
      primary: "#0D47A1", // Ana mavi
      secondary: "#42A5F5", // Açık mavi
      background: "#E1E7EF", // Açık arkaplan
      card: "#FFFFFF", // Kart rengi
      text: "#1A237E", // Koyu mavi metin
      border: "#ededed", // Açık mavi border
    },
    dark: {
      primary: "#26998d", // Koyu mavi
      secondary: "#1e6f67", // Daha koyu mavi
      background: "#161F2C", // Gece mavisi
      card: "#242c3b", // Koyu kart
      text: "#E3F2FD", // Açık mavi metin
      border: "#1c2737", // Koyu border
    },
  },

  // ALIŞTIRMA MODU - MOR
  practice: {
    light: {
      primary: "#7B1FA2", // Ana mor
      secondary: "#9C27B0", // Açık mor
      background: "#E8E6F2", // Açık mor arkaplan
      card: "#FFFFFF",
      text: "#4A148C", // Koyu mor metin
      border: "#d1cfdb", // Açık mor border
    },
    dark: {
      primary: "#7c43a0", // Koyu mor
      secondary: "#4A148C", // Daha koyu mor
      background: "#2a243f", // Gece moru
      card: "#3c2a54",
      text: "#F3E5F5", // Açık mor metin
      border: "#4c316f",
    },
  },

  // MÜSABAKA MODU - KIRMIZI
  competition: {
    light: {
      primary: "#D32F2F", // Ana kırmızı
      secondary: "#F44336", // Açık kırmızı
      background: "#F1E3E3", // Açık kırmızı arkaplan
      card: "#FFFFFF",
      text: "#B71C1C", // Koyu kırmızı metin
      border: "#FFFFFF", // Açık kırmızı border
    },
    dark: {
      primary: "#C62828", // Koyu kırmızı
      secondary: "#B71C1C", // Daha koyu kırmızı
      background: "#2C1616", // Gece kırmızısı
      card: "#4A1C1C",
      text: "#FFEBEE", // Açık kırmızı metin
      border: "#4A1C1C",
    },
  },

  // ETKİNLİK MODU - SARI
  event: {
    light: {
      primary: "#FFA000", // Ana sarı
      secondary: "#FFB300", // Açık sarı
      background: "#F4ECDC", // Açık sarı arkaplan
      card: "#FFFFFF",
      text: "#5D4037", // Kahverengi metin
      border: "#FFFFFF", // Açık sarı border
    },
    dark: {
      primary: "#FF8F00", // Koyu sarı
      secondary: "#FF6F00", // Turuncu-sarı
      background: "#55431f", // Koyu sarı arkaplan
      card: "#3E2F00",
      text: "#FFF3E0", // Açık sarı metin
      border: "#533e00",
    },
  },
};

// Varsayılan değerler
export const defaultTheme: ThemeMode = "light";
export const defaultAppMode: AppMode = "education";
