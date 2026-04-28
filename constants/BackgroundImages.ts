import type { AppMode, ThemeMode } from "./Colors";

// Dikey ve yatay arka plan görselleri için tip tanımı
interface OrientationImages {
  vertical: any;
  horizontal: any;
}

// Doğru require path'leri - @/assets/ yerine ../../assets/
export const backgroundImages: Record<
  AppMode,
  Record<ThemeMode, OrientationImages>
> = {
  education: {
    light: {
      vertical: require("../assets/images/backgrounds/education-light-bg.png"),
      horizontal: require("../assets/images/backgrounds/education-light-horizontal-bg.png"),
    },
    dark: {
      vertical: require("../assets/images/backgrounds/education-dark-bg.png"),
      horizontal: require("../assets/images/backgrounds/education-dark-horizontal-bg.png"),
    },
  },
  practice: {
    light: {
      vertical: require("../assets/images/backgrounds/practice-light-bg.png"),
      horizontal: require("../assets/images/backgrounds/practice-light-horizontal-bg.png"),
    },
    dark: {
      vertical: require("../assets/images/backgrounds/practice-dark-bg.png"),
      horizontal: require("../assets/images/backgrounds/practice-dark-horizontal-bg.png"),
    },
  },
  competition: {
    light: {
      vertical: require("../assets/images/backgrounds/competition-light-bg.png"),
      horizontal: require("../assets/images/backgrounds/competition-light-horizontal-bg.png"),
    },
    dark: {
      vertical: require("../assets/images/backgrounds/competition-dark-bg.png"),
      horizontal: require("../assets/images/backgrounds/competition-dark-horizontal-bg.png"),
    },
  },
  event: {
    light: {
      vertical: require("../assets/images/backgrounds/event-light-bg.png"),
      horizontal: require("../assets/images/backgrounds/event-light-horizontal-bg.png"),
    },
    dark: {
      vertical: require("../assets/images/backgrounds/event-dark-bg.png"),
      horizontal: require("../assets/images/backgrounds/event-dark-horizontal-bg.png"),
    },
  },
};
