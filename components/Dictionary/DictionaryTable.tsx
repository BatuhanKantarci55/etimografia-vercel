import CustomText from "@components/CustomText";
import WordListItem from "@components/Dictionary/WordListItem";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { memo } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SortDirection, SortField, Word } from "../../types/dictionary";

interface DictionaryTableProps {
  words: Word[];
  onBookmarkToggle: (id: number) => void;
  onSortChange: (field: SortField) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  refreshing?: boolean;
  onRefresh?: () => void;
  onScroll?: (event: any) => void;
  contentContainerStyle?: any;
  onDetailToggle?: (wordId: number | null) => void;
  openDetailId?: number | null;
}

const DictionaryTable = memo(function DictionaryTable({
  words,
  onBookmarkToggle,
  onSortChange,
  sortField,
  sortDirection,
  refreshing = false,
  onRefresh,
  onScroll,
  contentContainerStyle,
  onDetailToggle,
  openDetailId,
}: DictionaryTableProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();

  const renderWord = ({ item, index }: { item: Word; index: number }) => (
    <WordListItem
      word={item}
      index={index}
      onBookmarkToggle={onBookmarkToggle}
      sortField={sortField}
      sortDirection={sortDirection}
      onDetailToggle={onDetailToggle}
      isDetailOpen={openDetailId === item.id}
    />
  );

  const renderHeader = () => (
    <View
      style={[
        styles.tableHeader,
        {
          backgroundColor: colors.text + "12",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: 12,
          paddingHorizontal: 8,
        },
      ]}
    >
      {/* Row Number */}
      <View
        style={[
          styles.headerCell,
          {
            width: 40,
            paddingHorizontal: 8,
          },
        ]}
      >
        <CustomText
          style={{
            fontSize: 12,
            color: colors.text + "80",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          #
        </CustomText>
      </View>

      {/* Eski Türkçe - Sortable */}
      <TouchableOpacity
        style={[
          styles.headerCell,
          {
            flex: 3,
            paddingHorizontal: 8,
          },
        ]}
        onPress={() => onSortChange("old_turkish_word")}
      >
        <View style={styles.sortableHeader}>
          <CustomText
            style={{
              fontSize: 12,
              color: colors.text + "80",
              fontWeight: "600",
            }}
          >
            Eski Türkçe
          </CustomText>
          {sortField === "old_turkish_word" && (
            <Ionicons
              name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
              style={styles.sortIcon}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Yeni Türkçe - Sortable */}
      <TouchableOpacity
        style={[
          styles.headerCell,
          {
            flex: 3,
            paddingHorizontal: 8,
          },
        ]}
        onPress={() => onSortChange("new_turkish_word")}
      >
        <View style={styles.sortableHeader}>
          <CustomText
            style={{
              fontSize: 12,
              color: colors.text + "80",
              fontWeight: "600",
            }}
          >
            Yeni Türkçe
          </CustomText>
          {sortField === "new_turkish_word" && (
            <Ionicons
              name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
              style={styles.sortIcon}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Zorluk - Sortable */}
      <TouchableOpacity
        style={[
          styles.headerCell,
          {
            width: 50,
            paddingHorizontal: 4,
          },
        ]}
        onPress={() => onSortChange("difficulty_level")}
      >
        <View style={[styles.sortableHeader, { justifyContent: "center" }]}>
          <CustomText
            style={{
              fontSize: 12,
              color: colors.text + "80",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Zorluk
          </CustomText>
          {sortField === "difficulty_level" && (
            <Ionicons
              name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
              style={styles.sortIcon}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Bookmark Header */}
      <View
        style={[
          styles.headerCell,
          {
            width: 40,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Ionicons
          name="bookmark-outline"
          size={20}
          color={colors.text + "80"}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View
      style={[
        styles.emptyContainer,
        {
          padding: 40,
          alignItems: "center",
          marginTop: 20,
        },
      ]}
    >
      <CustomText
        style={{
          fontSize: 16,
          color: colors.text + "60",
          textAlign: "center",
        }}
      >
        Kelime bulunamadı.
      </CustomText>
      <CustomText
        style={{
          fontSize: 14,
          color: colors.text + "40",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Lütfen arama teriminizi veya filtreleri değiştirin.
      </CustomText>
    </View>
  );

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressViewOffset={scale(60)}
    />
  ) : undefined;

  return (
    <View style={[styles.container, contentContainerStyle]}>
      <View
        style={[
          styles.tableWrapper,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          // DÜZELTME: isDesktop ile eklenen alt köşe radius iptal kodu silindi. Kavisler geri geldi.
        ]}
      >
        {renderHeader()}

        <FlatList
          data={words}
          renderItem={renderWord}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={Platform.OS !== "web"}
          refreshControl={refreshControl}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.flatListContent,
            { paddingBottom: scale(20) },
          ]}
          extraData={openDetailId}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableWrapper: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  flatListContent: {
    flexGrow: 1,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerCell: {
    justifyContent: "center",
  },
  sortableHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default DictionaryTable;
