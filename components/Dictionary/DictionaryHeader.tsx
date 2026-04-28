import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import {
  Animated,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface DictionaryHeaderProps {
  scrollY: number;
  searchTerm: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
  onSavedExercisesPress: () => void;
  navbarHeight: number;
  statusBarHeight: number;
}

export default function DictionaryHeader({
  scrollY,
  searchTerm,
  onSearchChange,
  onFilterPress,
  onSavedExercisesPress,
  navbarHeight,
  statusBarHeight,
}: DictionaryHeaderProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      onSearchChange(text);
    }, 250),
    [],
  );

  const handleSearchChange = (text: string) => {
    setLocalSearch(text);
    debouncedSearch(text);
  };

  // Calculate opacity based on scroll position
  const getOpacity = () => {
    const normalizedScroll = Math.min(scrollY / 100, 1);
    return 1 - normalizedScroll * 0.5;
  };

  const opacity = getOpacity();

  return (
    <Animated.View
      style={[
        styles.fixedNavbar,
        {
          height: navbarHeight,
          paddingTop: statusBarHeight,
          backgroundColor: colors.card,
          opacity: 1, // Sabit opacity değeri
          justifyContent: "center",
        },
        isDesktop && {
          borderBottomLeftRadius: scale(16),
          borderBottomRightRadius: scale(16),
        },
      ]}
    >
      <View style={styles.navbarContent}>
        {/* Left: Play icon - Saved Exercises */}
        <TouchableOpacity
          onPress={onSavedExercisesPress}
          style={[
            styles.iconContainer,
            // DEĞİŞİKLİK: İkon kutusu masaüstünde orantılı küçültüldü (40px yüksekliğe uygun)
            {
              width: scale(isDesktop ? 28 : 40),
              height: scale(isDesktop ? 28 : 40),
            },
          ]}
        >
          <Ionicons
            name="play-circle-outline"
            size={scale(isDesktop ? 18 : 24)}
            color={colors.text}
          />
        </TouchableOpacity>

        {/* Center: Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInputContainer,
              {
                backgroundColor: colors.background,
              },
              // DEĞİŞİKLİK: Arama kutusu dikey boşlukları ve yuvarlaklığı masaüstü için daraltıldı
              isDesktop && {
                paddingVertical: scale(2),
                borderRadius: scale(8),
              },
            ]}
          >
            <Ionicons
              name="search"
              size={scale(isDesktop ? 13 : 18)}
              color={colors.text + "80"}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  // DEĞİŞİKLİK: Yazı boyutu masaüstü için küçültüldü
                  fontSize: scale(isDesktop ? 11 : 15),
                },
                isDesktop && { paddingVertical: 0 },
              ]}
              placeholder="Kelime ara..."
              placeholderTextColor={colors.text + "60"}
              value={localSearch}
              onChangeText={handleSearchChange}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Right: Filter Icon Only */}
        <View style={styles.rightIcons}>
          <TouchableOpacity
            onPress={onFilterPress}
            style={[
              styles.iconContainer,
              // DEĞİŞİKLİK: İkon kutusu masaüstünde orantılı küçültüldü
              {
                width: scale(isDesktop ? 28 : 40),
                height: scale(isDesktop ? 28 : 40),
              },
            ]}
          >
            <Ionicons
              name="filter-outline"
              size={scale(isDesktop ? 18 : 24)}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fixedNavbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 0,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  navbarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 2,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
});
