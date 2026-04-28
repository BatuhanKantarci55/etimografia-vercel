import BackgroundImage from "@components/BackgroundImage";
import DictionaryFilterModal from "@components/Dictionary/DictionaryFilterModal";
import DictionaryHeader from "@components/Dictionary/DictionaryHeader";
import DictionaryTable from "@components/Dictionary/DictionaryTable";
import SavedExercisesModal from "@components/Dictionary/SavedExercisesModal";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, StatusBar, StyleSheet, View } from "react-native";
import {
  Filters,
  SortDirection,
  SortField,
  Word,
} from "../../types/dictionary";

// JSON verilerini import et
const wordsData = require("../../assets/data/words.json") as Word[];
const unitsData = require("../../assets/data/units.json");
const stagesData = require("../../assets/data/stages.json");

export default function DictionaryScreen() {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop değerini destruct ettik
  const { scale, isDesktop } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [savedExercisesModalVisible, setSavedExercisesModalVisible] =
    useState(false);
  const [openDetailId, setOpenDetailId] = useState<number | null>(null);

  const [filters, setFilters] = useState<Filters>({
    origin: "All",
    difficulty: 0,
    unit: null,
    stage: null,
    onlySaved: false,
  });

  const [sortField, setSortField] = useState<SortField>("old_turkish_word");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const scrollY = useRef(0);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedWords = await loadSavedWords();
      const wordsWithSaved = wordsData.map((word: Word) => ({
        ...word,
        isSaved: savedWords.includes(word.id),
      }));
      setWords(wordsWithSaved);
      setFilteredWords(wordsWithSaved);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadSavedWords = async (): Promise<number[]> => {
    return [];
  };

  // Filtering process
  useEffect(() => {
    const filtered = words.filter((word) => {
      // Search filter
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        const oldWordMatch = word.old_turkish_word
          .toLowerCase()
          .includes(searchLower);
        const newWordMatch = word.new_turkish_word
          .toLowerCase()
          .includes(searchLower);

        if (!oldWordMatch && !newWordMatch) {
          return false;
        }
      }

      // Origin filter
      if (filters.origin !== "All") {
        if (
          word.old_turkish_origin !== filters.origin &&
          word.new_turkish_origin !== filters.origin
        ) {
          return false;
        }
      }

      // Difficulty filter
      if (
        filters.difficulty !== 0 &&
        word.difficulty_level !== filters.difficulty
      ) {
        return false;
      }

      // Unit filter
      if (filters.unit !== null && word.word_unit !== filters.unit) {
        return false;
      }

      // Stage filter
      if (filters.stage !== null && word.word_stage !== filters.stage) {
        return false;
      }

      // Only saved filter
      if (filters.onlySaved && !word.isSaved) {
        return false;
      }

      return true;
    });

    // Sorting process
    const sorted = [...filtered].sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case "old_turkish_word":
          valueA = a.old_turkish_word.toLowerCase();
          valueB = b.old_turkish_word.toLowerCase();
          break;
        case "new_turkish_word":
          valueA = a.new_turkish_word.toLowerCase();
          valueB = b.new_turkish_word.toLowerCase();
          break;
        case "difficulty_level":
          valueA = a.difficulty_level;
          valueB = b.difficulty_level;
          break;
        case "id":
        default:
          valueA = a.id;
          valueB = b.id;
          break;
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredWords(sorted);
  }, [words, searchTerm, filters, sortField, sortDirection]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadData();

      if (Platform.OS !== "web") {
        Alert.alert("✅ Sayfa Yenilendi", "Sözlük verileri güncellendi.", [
          { text: "Tamam" },
        ]);
      } else {
        console.log("Sözlük yenilendi");
      }
    } catch (error) {
      console.error("Sayfa yenilenirken hata:", error);
      if (Platform.OS !== "web") {
        Alert.alert("❌ Hata", "Sayfa yenilenirken bir hata oluştu.", [
          { text: "Tamam" },
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleBookmarkToggle = async (wordId: number) => {
    setWords((prev) =>
      prev.map((word) =>
        word.id === wordId ? { ...word, isSaved: !word.isSaved } : word,
      ),
    );
  };

  const handleDetailToggle = (wordId: number | null) => {
    setOpenDetailId(wordId);
  };

  const handleScroll = (event: any) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  };

  const statusBarHeight =
    Platform.OS === "ios" ? scale(40) : StatusBar.currentHeight || 0;
  // DEĞİŞİKLİK: Masaüstünde bar yüksekliği ana sayfadaki gibi tam olarak 40 yapıldı.
  const navbarHeight = scale(isDesktop ? 40 : 70);

  // DEĞİŞİKLİK: Tüm içerik bir değişkende toplandı.
  const screenContent = (
    <>
      <DictionaryHeader
        scrollY={scrollY.current}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onFilterPress={() => setFilterModalVisible(true)}
        onSavedExercisesPress={() => setSavedExercisesModalVisible(true)}
        navbarHeight={navbarHeight}
        statusBarHeight={statusBarHeight}
      />

      <View style={{ flex: 1 }}>
        <DictionaryTable
          words={filteredWords}
          onBookmarkToggle={handleBookmarkToggle}
          onSortChange={handleSortChange}
          sortField={sortField}
          sortDirection={sortDirection}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScroll={handleScroll}
          onDetailToggle={handleDetailToggle}
          openDetailId={openDetailId}
          contentContainerStyle={{
            paddingTop: navbarHeight + scale(10),
            paddingBottom: isDesktop ? 16 : scale(20), // DÜZELTME: Masaüstü için tablo maksimum uzunluğa çekildi, alt kavislerin (yuvarlak köşelerin) pürüzsüz görünmesi için yalnızca sabit 16px ince bir boşluk bırakıldı.
            paddingHorizontal: 16,
          }}
        />
      </View>

      <DictionaryFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        unitsData={unitsData}
        stagesData={stagesData}
      />

      <SavedExercisesModal
        visible={savedExercisesModalVisible}
        onClose={() => setSavedExercisesModalVisible(false)}
      />
    </>
  );

  // DEĞİŞİKLİK: Masaüstündeysek tüm ekranı kaplayan desen var, o yüzden yeniden BackgroundImage basmıyoruz.
  if (isDesktop) {
    return <View style={{ flex: 1 }}>{screenContent}</View>;
  }

  return (
    <BackgroundImage overlayOpacity={0.03}>{screenContent}</BackgroundImage>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
    paddingHorizontal: 16,
  },
});
