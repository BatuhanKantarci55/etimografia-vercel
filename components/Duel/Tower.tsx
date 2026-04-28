import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  pieces: number; // 0-10 (10 ile kazanma)
  fillBar: number; // 0-fillBarCapacity (sadece kendi için gösterilir)
  fillBarCapacity: number; // Dolum barı kapasitesi (15)
  towerPiecesToWin: number; // Kazanmak için gereken parça sayısı (10)
  color: string; // mavi veya kırmızı
  label: string;
  showFillBar?: boolean; // sadece kendine ait olan gösterilir
}

export default function Tower({
  pieces,
  fillBar,
  fillBarCapacity,
  towerPiecesToWin,
  color,
  label,
  showFillBar = false,
}: Props) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  // Kule parçasını render eden yardımcı fonksiyon
  const renderBlock = (index: number) => {
    const isFilled = index < pieces;
    return (
      <View
        key={index}
        style={[
          styles.block,
          {
            width: scale(20),
            height: scale(20),
            backgroundColor: isFilled ? color : colors.card + "40",
            borderColor: isFilled ? color : colors.border,
            marginBottom: scale(2),
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 3 Sütunlu Kale Görünümü */}
      <View style={[styles.tower, { minHeight: scale(90) }]}>
        {/* Sol Sütun: Parçalar 1, 2, 3, 4 (İndeks: 0, 1, 2, 3) */}
        <View style={[styles.column, { marginRight: scale(2) }]}>
          {[0, 1, 2, 3].map(renderBlock)}
        </View>

        {/* Orta Sütun: Parçalar 9, 10 (İndeks: 8, 9) */}
        <View style={[styles.column, { marginRight: scale(2) }]}>
          {[8, 9].map(renderBlock)}
        </View>

        {/* Sağ Sütun: Parçalar 5, 6, 7, 8 (İndeks: 4, 5, 6, 7) */}
        <View style={styles.column}>{[4, 5, 6, 7].map(renderBlock)}</View>
      </View>

      {showFillBar && (
        <View style={[styles.fillBarContainer, { marginTop: scale(6) }]}>
          <View
            style={[
              styles.fillBarBg,
              {
                backgroundColor: colors.card,
                width: scale(70),
                height: scale(14),
                borderRadius: scale(7),
              },
            ]}
          >
            <View
              style={[
                styles.fillBarFill,
                {
                  width: `${(fillBar / fillBarCapacity) * 100}%`,
                  backgroundColor: color,
                  height: scale(14),
                  borderRadius: scale(7),
                },
              ]}
            />
            <View style={styles.fillBarTextContainer}>
              <CustomText
                style={[
                  styles.fillBarText,
                  { color: "white", fontSize: scale(9) },
                ]}
              >
                {fillBar}/{fillBarCapacity}
              </CustomText>
            </View>
          </View>
        </View>
      )}
      <CustomText
        style={[
          styles.label,
          { color: colors.text, fontSize: scale(12), marginTop: scale(6) },
        ]}
        numberOfLines={1}
      >
        {label}
      </CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
  },
  tower: {
    flexDirection: "row",
    alignItems: "flex-end", // Ortadaki kısa sütun ile kenarların altını hizala
    justifyContent: "center",
  },
  column: {
    flexDirection: "column-reverse", // İndeksi küçük olan (ilk eklenen) alta gelsin
    alignItems: "center",
  },
  block: {
    borderWidth: 2,
    borderRadius: 6,
  },
  fillBarContainer: {
    alignItems: "center",
  },
  fillBarBg: {
    overflow: "hidden",
    position: "relative",
  },
  fillBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  fillBarTextContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fillBarText: {
    fontWeight: "bold",
  },
  label: {
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 100,
  },
});
