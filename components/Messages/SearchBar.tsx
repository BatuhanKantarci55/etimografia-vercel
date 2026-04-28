import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface SearchBarProps {
  query: string;
  onSearch: (text: string) => void;
  onClose: () => void;
  resultCount: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export default function SearchBar({
  query,
  onSearch,
  onClose,
  resultCount,
  currentIndex,
  onNext,
  onPrev,
}: SearchBarProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.text + "20",
        },
      ]}
    >
      <View
        style={[
          styles.searchContainer,
          isDesktop && { paddingVertical: scale(4) },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons
            name="arrow-back"
            size={scale(isDesktop ? 12 : 24)}
            color={colors.text}
          />
        </TouchableOpacity>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderRadius: scale(8),
              flex: 1,
            },
          ]}
        >
          <Ionicons
            name="search"
            // DEĞİŞİKLİK: Masaüstü için ikon daraltıldı (12 -> 10)
            size={scale(isDesktop ? 10 : 20)}
            color={colors.text + "60"}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                // DEĞİŞİKLİK: Masaüstü arama alanı font ve padding'i daha da daraltıldı (11 -> 10, 2 -> 1)
                fontSize: scale(isDesktop ? 10 : 14),
                paddingVertical: scale(isDesktop ? 1 : 8),
              },
            ]}
            placeholder="Sohbette ara..."
            placeholderTextColor={colors.text + "60"}
            value={query}
            onChangeText={onSearch}
            autoFocus
          />
        </View>

        {resultCount > 0 && (
          <View style={styles.navigationContainer}>
            <CustomText
              style={{
                // DEĞİŞİKLİK: Sayaç metni daraltıldı (9 -> 8)
                fontSize: scale(isDesktop ? 8 : 12),
                color: colors.text + "60",
                marginRight: scale(8),
              }}
            >
              {currentIndex + 1}/{resultCount}
            </CustomText>
            <TouchableOpacity
              onPress={onPrev}
              style={styles.navButton}
              disabled={resultCount === 0}
            >
              <Ionicons
                name="chevron-up"
                // DEĞİŞİKLİK: Yukarı ok daraltıldı (12 -> 10)
                size={scale(isDesktop ? 10 : 20)}
                color={resultCount > 0 ? colors.text : colors.text + "40"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              style={styles.navButton}
              disabled={resultCount === 0}
            >
              <Ionicons
                name="chevron-down"
                // DEĞİŞİKLİK: Aşağı ok daraltıldı (12 -> 10)
                size={scale(isDesktop ? 10 : 20)}
                color={resultCount > 0 ? colors.text : colors.text + "40"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
  },
  navigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  navButton: {
    padding: 4,
  },
});
