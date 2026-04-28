import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { originColors, originNamesTR } from "constants/OriginColors";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  DifficultyType,
  Filters,
  OriginType,
  Stage,
  Unit,
} from "../../types/dictionary";

interface DictionaryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Filters) => void;
  currentFilters: Filters;
  unitsData: Unit[];
  stagesData: Stage[];
}

export default function DictionaryFilterModal({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
  unitsData,
  stagesData,
}: DictionaryFilterModalProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();
  const [localFilters, setLocalFilters] = useState<Filters>(currentFilters);
  const [filteredStages, setFilteredStages] = useState<Stage[]>([]);

  const originTypes: OriginType[] = [
    "All",
    "Turkish",
    "Arabic",
    "Persian",
    "French",
    "English",
    "Latin",
    "Italian",
    "Greek",
  ];
  const difficultyLevels: DifficultyType[] = [0, 1, 2, 3, 4, 5];

  // Filter stages when unit changes
  useEffect(() => {
    if (localFilters.unit !== null) {
      const filtered = stagesData.filter(
        (stage) => stage.unit_number === localFilters.unit,
      );
      setFilteredStages(filtered);

      // Reset stage if selected stage is not in filtered list
      if (
        localFilters.stage !== null &&
        !filtered.some((stage) => stage.stage_number === localFilters.stage)
      ) {
        setLocalFilters((prev) => ({ ...prev, stage: null }));
      }
    } else {
      setFilteredStages([]);
      setLocalFilters((prev) => ({ ...prev, stage: null }));
    }
  }, [localFilters.unit, stagesData]);

  const handleOriginSelect = (origin: OriginType) => {
    setLocalFilters((prev) => ({ ...prev, origin }));
  };

  const handleDifficultySelect = (difficulty: DifficultyType) => {
    setLocalFilters((prev) => ({ ...prev, difficulty }));
  };

  const handleUnitSelect = (unit: number | null) => {
    setLocalFilters((prev) => ({ ...prev, unit, stage: null }));
  };

  const handleStageSelect = (stage: number | null) => {
    setLocalFilters((prev) => ({ ...prev, stage }));
  };

  const handleOnlySavedToggle = () => {
    setLocalFilters((prev) => ({
      ...prev,
      onlySaved: !prev.onlySaved,
    }));
  };

  const handleClearFilters = () => {
    setLocalFilters({
      origin: "All",
      difficulty: 0,
      unit: null,
      stage: null,
      onlySaved: false,
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      // DEĞİŞİKLİK: "Filters" yerine "Filtreleme"
      title="Filtreleme"
      height="85%"
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Origin Filter */}
        <View style={styles.section}>
          <CustomText
            style={[
              styles.sectionTitle,
              {
                fontSize: scale(16),
                color: colors.text,
                marginBottom: scale(12),
              },
            ]}
          >
            {/* DEĞİŞİKLİK: "Origin" yerine "Köken" */}
            Köken
          </CustomText>
          <View style={styles.originGrid}>
            {originTypes.map((origin) => (
              <TouchableOpacity
                key={origin}
                style={[
                  styles.originButton,
                  {
                    backgroundColor:
                      localFilters.origin === origin
                        ? origin === "All"
                          ? colors.primary + "20"
                          : originColors[origin] + "20"
                        : colors.card,
                    // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                    borderWidth: 0,
                    paddingVertical: scale(10),
                    paddingHorizontal: scale(12),
                    borderRadius: scale(8),
                  },
                ]}
                onPress={() => handleOriginSelect(origin)}
              >
                {origin !== "All" && (
                  <View
                    style={[
                      styles.originColorIndicator,
                      {
                        backgroundColor: originColors[origin],
                        width: scale(12),
                        height: scale(12),
                        borderRadius: scale(6),
                        marginRight: scale(6),
                      },
                    ]}
                  />
                )}
                <CustomText
                  style={[
                    styles.originText,
                    {
                      fontSize: scale(13),
                      color:
                        localFilters.origin === origin
                          ? colors.text
                          : colors.text + "80",
                    },
                  ]}
                >
                  {/* DEĞİŞİKLİK: "All" yerine "Tümü" */}
                  {origin === "All" ? "Tümü" : originNamesTR[origin]}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty Filter */}
        <View style={styles.section}>
          <CustomText
            style={[
              styles.sectionTitle,
              {
                fontSize: scale(16),
                color: colors.text,
                marginBottom: scale(12),
              },
            ]}
          >
            {/* DEĞİŞİKLİK: "Difficulty Level" yerine "Zorluk Seviyesi" */}
            Zorluk Seviyesi
          </CustomText>
          <View style={styles.difficultyGrid}>
            {difficultyLevels.map((difficulty) => (
              <TouchableOpacity
                key={difficulty}
                style={[
                  styles.difficultyButton,
                  {
                    backgroundColor:
                      localFilters.difficulty === difficulty
                        ? difficulty === 0
                          ? colors.primary + "20"
                          : "#FFD700" + "20"
                        : colors.card,
                    // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                    borderWidth: 0,
                    paddingVertical: scale(10),
                    paddingHorizontal: scale(12),
                    borderRadius: scale(8),
                  },
                ]}
                onPress={() => handleDifficultySelect(difficulty)}
              >
                {difficulty === 0 ? (
                  <CustomText
                    style={[
                      styles.difficultyText,
                      {
                        fontSize: scale(13),
                        color:
                          localFilters.difficulty === difficulty
                            ? colors.text
                            : colors.text + "80",
                      },
                    ]}
                  >
                    {/* DEĞİŞİKLİK: "All" yerine "Tümü" */}
                    Tümü
                  </CustomText>
                ) : (
                  <View style={styles.starsContainer}>
                    {[...Array(difficulty)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={scale(16)}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Unit Filter */}
        <View style={styles.section}>
          <CustomText
            style={[
              styles.sectionTitle,
              {
                fontSize: scale(16),
                color: colors.text,
                marginBottom: scale(12),
              },
            ]}
          >
            {/* DEĞİŞİKLİK: "Unit" yerine "Ünite" */}
            Ünite
          </CustomText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.unitScrollView}
          >
            <TouchableOpacity
              style={[
                styles.unitButton,
                {
                  backgroundColor:
                    localFilters.unit === null
                      ? colors.primary + "20"
                      : colors.card,
                  // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                  borderWidth: 0,
                  paddingVertical: scale(10),
                  paddingHorizontal: scale(16),
                  borderRadius: scale(8),
                  marginRight: scale(8),
                },
              ]}
              onPress={() => handleUnitSelect(null)}
            >
              <CustomText
                style={[
                  styles.unitText,
                  {
                    fontSize: scale(13),
                    color:
                      localFilters.unit === null
                        ? colors.text
                        : colors.text + "80",
                  },
                ]}
              >
                {/* DEĞİŞİKLİK: "All" yerine "Tümü" */}
                Tümü
              </CustomText>
            </TouchableOpacity>

            {unitsData.map((unit) => (
              <TouchableOpacity
                key={unit.unit_number}
                style={[
                  styles.unitButton,
                  {
                    backgroundColor:
                      localFilters.unit === unit.unit_number
                        ? colors.primary + "20"
                        : colors.card,
                    // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                    borderWidth: 0,
                    paddingVertical: scale(10),
                    paddingHorizontal: scale(16),
                    borderRadius: scale(8),
                    marginRight: scale(8),
                  },
                ]}
                onPress={() => handleUnitSelect(unit.unit_number)}
              >
                <CustomText
                  style={[
                    styles.unitText,
                    {
                      fontSize: scale(13),
                      color:
                        localFilters.unit === unit.unit_number
                          ? colors.text
                          : colors.text + "80",
                    },
                  ]}
                >
                  {unit.unit_name}
                </CustomText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stage Filter - Show only if unit selected */}
        {localFilters.unit !== null && filteredStages.length > 0 && (
          <View style={styles.section}>
            <CustomText
              style={[
                styles.sectionTitle,
                {
                  fontSize: scale(16),
                  color: colors.text,
                  marginBottom: scale(12),
                },
              ]}
            >
              {/* DEĞİŞİKLİK: "Stage" yerine "Aşama" */}
              Aşama
            </CustomText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.unitScrollView}
            >
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  {
                    backgroundColor:
                      localFilters.stage === null
                        ? colors.primary + "20"
                        : colors.card,
                    // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                    borderWidth: 0,
                    paddingVertical: scale(10),
                    paddingHorizontal: scale(16),
                    borderRadius: scale(8),
                    marginRight: scale(8),
                  },
                ]}
                onPress={() => handleStageSelect(null)}
              >
                <CustomText
                  style={[
                    styles.unitText,
                    {
                      fontSize: scale(13),
                      color:
                        localFilters.stage === null
                          ? colors.text
                          : colors.text + "80",
                    },
                  ]}
                >
                  {/* DEĞİŞİKLİK: "All" yerine "Tümü" */}
                  Tümü
                </CustomText>
              </TouchableOpacity>

              {filteredStages.map((stage) => (
                <TouchableOpacity
                  key={`${stage.unit_number}-${stage.stage_number}`}
                  style={[
                    styles.unitButton,
                    {
                      backgroundColor:
                        localFilters.stage === stage.stage_number
                          ? colors.primary + "20"
                          : colors.card,
                      // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                      borderWidth: 0,
                      paddingVertical: scale(10),
                      paddingHorizontal: scale(16),
                      borderRadius: scale(8),
                      marginRight: scale(8),
                    },
                  ]}
                  onPress={() => handleStageSelect(stage.stage_number)}
                >
                  <CustomText
                    style={[
                      styles.unitText,
                      {
                        fontSize: scale(13),
                        color:
                          localFilters.stage === stage.stage_number
                            ? colors.text
                            : colors.text + "80",
                      },
                    ]}
                  >
                    {stage.stage_name}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Only Saved Filter */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.onlySavedButton,
              {
                backgroundColor: colors.card,
                padding: scale(16),
                borderRadius: scale(12),
                // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                borderWidth: 0,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
            onPress={handleOnlySavedToggle}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name={localFilters.onlySaved ? "bookmark" : "bookmark-outline"}
                size={scale(24)}
                color={localFilters.onlySaved ? colors.primary : colors.text}
                style={{ marginRight: scale(12) }}
              />
              <View>
                <CustomText
                  style={{
                    fontSize: scale(16),
                    color: colors.text,
                    fontWeight: "500",
                  }}
                >
                  {/* DEĞİŞİKLİK: "Only Saved Words" yerine "Yalnızca Kaydedilmiş Sözcükler" */}
                  Yalnızca Kaydedilmiş Sözcükler
                </CustomText>
                <CustomText
                  style={{
                    fontSize: scale(12),
                    color: colors.text + "60",
                    marginTop: scale(4),
                  }}
                >
                  {/* DEĞİŞİKLİK: "Show only bookmarked words" yerine "Yalnızca yer imi eklenmiş sözcükleri göster" */}
                  Yalnızca yer imi eklenmiş sözcükleri göster
                </CustomText>
              </View>
            </View>
            <Ionicons
              name={localFilters.onlySaved ? "checkbox" : "square-outline"}
              size={scale(24)}
              color={
                localFilters.onlySaved ? colors.primary : colors.text + "60"
              }
            />
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={[styles.section, { marginTop: scale(20) }]}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: colors.card,
                  // DEĞİŞİKLİK: Kenar çizgisi kaldırıldı
                  borderWidth: 0,
                  paddingVertical: scale(14),
                  paddingHorizontal: scale(24),
                  borderRadius: scale(12),
                  flex: 1,
                  marginRight: scale(8),
                },
              ]}
              onPress={handleClearFilters}
            >
              <CustomText
                style={{
                  fontSize: scale(16),
                  color: colors.text,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                {/* DEĞİŞİKLİK: "Clear" yerine "Temizle" */}
                Temizle
              </CustomText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  paddingVertical: scale(14),
                  paddingHorizontal: scale(24),
                  borderRadius: scale(12),
                  flex: 1,
                  marginLeft: scale(8),
                },
              ]}
              onPress={handleApplyFilters}
            >
              <CustomText
                style={{
                  fontSize: scale(16),
                  color: "white",
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                {/* DEĞİŞİKLİK: "Apply" yerine "Uygula" */}
                Uygula
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  originGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  originButton: {
    flexDirection: "row",
    alignItems: "center",
    margin: 4,
  },
  originColorIndicator: {
    borderRadius: 6,
  },
  originText: {
    fontWeight: "500",
  },
  difficultyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  difficultyButton: {
    margin: 4,
  },
  starsContainer: {
    flexDirection: "row",
  },
  difficultyText: {
    fontWeight: "500",
  },
  unitScrollView: {
    flexDirection: "row",
  },
  unitButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  unitText: {
    fontWeight: "500",
  },
  onlySavedButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  primaryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
