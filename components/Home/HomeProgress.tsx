import CustomText from "@components/CustomText";
import { useEducation } from "@contexts/EducationContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import UnitListModal from "./UnitListModal";

// JSON dosyalarını import et
import stagesData from "@assets/data/stages.json";
import unitsData from "@assets/data/units.json";

// Ünite ve aşama verileri için interface'ler
interface Unit {
  unit_number: number;
  unit_name: string;
}

interface Stage {
  unit_number: number;
  stage_number: number;
  stage_name: string;
}

interface HomeProgressProps {
  unitNumber: number;
  stageNumber: number;
  step: number; // 1-3 arası (hangi adımda olduğu)
  onUnitChange?: (unitNumber: number) => void;
}

export default function HomeProgress({
  unitNumber,
  stageNumber,
  step,
  onUnitChange,
}: HomeProgressProps) {
  const { colors, themeMode } = useTheme();
  // isDesktop eklendi
  const { scale, isDesktop } = useResponsive();
  const { educationScore } = useEducation();
  const [modalVisible, setModalVisible] = useState(false);

  // Animasyon değerleri
  const step1Anim = useRef(new Animated.Value(0)).current;
  const step2Anim = useRef(new Animated.Value(0)).current;
  const step3Anim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevStepRef = useRef(step);

  // Temaya göre ünite görselini yükle
  const getUnitImage = (unitNumber: number) => {
    // Tema bazlı görsel seçimi
    if (themeMode === "dark") {
      switch (unitNumber) {
        case 1:
          return require("@assets/images/units/unit1-dark.png");
        case 2:
          return require("@assets/images/units/unit2-dark.png");
        case 3:
          return require("@assets/images/units/unit3-dark.png");
        case 4:
          return require("@assets/images/units/unit4-dark.png");
        case 5:
          return require("@assets/images/units/unit5-dark.png");
        case 6:
          return require("@assets/images/units/unit6-dark.png");
        case 7:
          return require("@assets/images/units/unit7-dark.png");
        default:
          return require("@assets/images/units/unit1-dark.png");
      }
    } else {
      switch (unitNumber) {
        case 1:
          return require("@assets/images/units/unit1-light.png");
        case 2:
          return require("@assets/images/units/unit2-light.png");
        case 3:
          return require("@assets/images/units/unit3-light.png");
        case 4:
          return require("@assets/images/units/unit4-light.png");
        case 5:
          return require("@assets/images/units/unit5-light.png");
        case 6:
          return require("@assets/images/units/unit6-light.png");
        case 7:
          return require("@assets/images/units/unit7-light.png");
        default:
          return require("@assets/images/units/unit1-light.png");
      }
    }
  };

  // Ünite ve aşama adlarını bul
  const currentUnit = (unitsData as Unit[]).find(
    (u) => u.unit_number === unitNumber,
  );
  const currentStage = (stagesData as Stage[]).find(
    (s) => s.unit_number === unitNumber && s.stage_number === stageNumber,
  );

  const unitName = currentUnit?.unit_name || `Ünite ${unitNumber}`;
  const stageName = currentStage?.stage_name || `Aşama ${stageNumber}`;

  // Adım değiştiğinde animasyonları tetikle
  useEffect(() => {
    if (prevStepRef.current !== step) {
      console.log(
        `🎬 HomeProgress - Adım değişti: ${prevStepRef.current} -> ${step}`,
      );

      // Glow efekti
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();

      // Yeni adıma göre animasyonları güncelle
      const target1 = step >= 2 ? 1 : 0; // 2. adımda 1. bar dolu
      const target2 = step >= 3 ? 1 : 0; // 3. adımda 2. bar dolu
      const target3 = 0; // 3. bar her zaman boş (aşama tamamlanınca sıfırlanacak)

      Animated.parallel([
        Animated.timing(step1Anim, {
          toValue: target1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(step2Anim, {
          toValue: target2,
          duration: 500,
          delay: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(step3Anim, {
          toValue: target3,
          duration: 500,
          delay: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();

      prevStepRef.current = step;
    }
  }, [step]);

  // İlk yüklemede mevcut adımı animasyonsuz ayarla
  useEffect(() => {
    step1Anim.setValue(step >= 2 ? 1 : 0);
    step2Anim.setValue(step >= 3 ? 1 : 0);
    step3Anim.setValue(0);
  }, []);

  // MASAÜSTÜ ÖZEL KÜÇÜLTME DEĞERLERİ
  // DEĞİŞİKLİK: 65% olan genişlik 72% yapılarak alan bir miktar büyütüldü.
  const containerWidth = isDesktop ? "72%" : "100%";
  const imageRadius = scale(isDesktop ? 12 : 16);

  // Masaüstünde görselin kırpılmasını engellemek için 16:9 oranı kullanıldı
  const imageStyle = isDesktop
    ? {
        width: "100%" as const,
        height: "100%" as const,
        borderTopLeftRadius: imageRadius,
        borderTopRightRadius: imageRadius,
      }
    : {
        width: "100%" as const,
        height: scale(200),
        borderTopLeftRadius: imageRadius,
        borderTopRightRadius: imageRadius,
      };

  // Animasyonlu renkler
  const getStepColor = (animValue: Animated.Value) => {
    return animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.text + "20", colors.primary],
    });
  };

  // Adım metinleri
  const getStepText = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return "Eleme";
      case 2:
        return "Pekiştirme";
      case 3:
        return "Sınav";
      default:
        return "";
    }
  };

  // Toplam puan
  const totalScore =
    educationScore?.total_education_score?.toLocaleString() || "0";

  const handleUnitSelect = (selectedUnit: number) => {
    if (onUnitChange) {
      onUnitChange(selectedUnit);
    }
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { borderRadius: imageRadius }, // DEĞİŞİKLİK: Köşelerdeki sivri gölgeleri yok etmek için ana taşıyıcıya da kavis eklendi
          isDesktop && { width: containerWidth, alignSelf: "center" },
        ]}
      >
        {/* Ünite Görseli - Tıklanabilir */}
        <TouchableOpacity
          style={[styles.imageContainer, isDesktop && { aspectRatio: 16 / 9 }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Image
            source={getUnitImage(unitNumber)}
            style={imageStyle}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)"]}
            style={[
              styles.imageGradient,
              {
                borderTopLeftRadius: imageRadius,
                borderTopRightRadius: imageRadius,
              },
            ]}
          />

          {/* Ünite ve Aşama Numarası Rozeti */}
          <View
            style={[
              styles.unitBadge,
              {
                backgroundColor: colors.primary,
                top: scale(isDesktop ? 10 : 16),
                left: scale(isDesktop ? 10 : 16),
                paddingHorizontal: scale(isDesktop ? 8 : 12),
                paddingVertical: scale(isDesktop ? 4 : 6),
                borderRadius: scale(isDesktop ? 12 : 20),
              },
            ]}
          >
            <CustomText
              style={{
                color: "white",
                fontSize: scale(isDesktop ? 9 : 12),
                fontWeight: "bold",
              }}
            >
              Ünite {unitNumber} • Aşama {stageNumber}
            </CustomText>
          </View>
        </TouchableOpacity>

        {/* Bilgi Kutusu */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderTopWidth: 0,
              borderBottomLeftRadius: imageRadius,
              borderBottomRightRadius: imageRadius,
              padding: scale(isDesktop ? 10 : 16),
            },
          ]}
        >
          {/* İlerleme Barı - 3 parçalı animasyonlu */}
          <View
            style={[
              styles.progressContainer,
              isDesktop && { marginBottom: 4, gap: 2 },
            ]}
          >
            {/* 1. Adım */}
            <View style={styles.progressSegmentWrapper}>
              <Animated.View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: getStepColor(step1Anim),
                    borderTopLeftRadius: scale(isDesktop ? 4 : 8),
                    borderBottomLeftRadius: scale(isDesktop ? 4 : 8),
                    height: scale(isDesktop ? 5 : 12),
                  },
                ]}
              />
              <CustomText
                style={[
                  styles.stepLabel,
                  {
                    color: step >= 2 ? colors.primary : colors.text + "40",
                    fontSize: scale(isDesktop ? 8 : 10),
                    marginTop: scale(isDesktop ? 2 : 4),
                  },
                ]}
              >
                {getStepText(1)}
              </CustomText>
            </View>

            {/* 2. Adım */}
            <View style={styles.progressSegmentWrapper}>
              <Animated.View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: getStepColor(step2Anim),
                    height: scale(isDesktop ? 5 : 12),
                  },
                ]}
              />
              <CustomText
                style={[
                  styles.stepLabel,
                  {
                    color: step >= 3 ? colors.primary : colors.text + "40",
                    fontSize: scale(isDesktop ? 8 : 10),
                    marginTop: scale(isDesktop ? 2 : 4),
                  },
                ]}
              >
                {getStepText(2)}
              </CustomText>
            </View>

            {/* 3. Adım */}
            <View style={styles.progressSegmentWrapper}>
              <Animated.View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: getStepColor(step3Anim),
                    borderTopRightRadius: scale(isDesktop ? 4 : 8),
                    borderBottomRightRadius: scale(isDesktop ? 4 : 8),
                    height: scale(isDesktop ? 5 : 12),
                  },
                ]}
              />
              <CustomText
                style={[
                  styles.stepLabel,
                  {
                    color: colors.text + "40",
                    fontSize: scale(isDesktop ? 8 : 10),
                    marginTop: scale(isDesktop ? 2 : 4),
                  },
                ]}
              >
                {getStepText(3)}
              </CustomText>
            </View>
          </View>

          {/* Puan Gösterge Alanı */}
          <View
            style={[styles.scoreContainer, isDesktop && { marginBottom: 4 }]}
          >
            <Ionicons
              name="book"
              size={scale(isDesktop ? 16 : 24)}
              color={colors.primary}
            />
            <CustomText
              style={[
                styles.scoreText,
                {
                  color: colors.primary,
                  fontSize: scale(isDesktop ? 14 : 20),
                  fontWeight: "bold",
                  marginLeft: scale(isDesktop ? 4 : 6),
                },
              ]}
            >
              {totalScore}
            </CustomText>
          </View>

          {/* Ünite ve Aşama Adları */}
          <View style={[styles.textContainer, isDesktop && { marginTop: 0 }]}>
            <View style={styles.nameWrapper}>
              <CustomText
                style={[
                  styles.unitName,
                  {
                    color: colors.text,
                    fontSize: scale(isDesktop ? 12 : 16),
                    fontWeight: "600",
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {unitName}
              </CustomText>
            </View>

            <View
              style={[
                styles.stageDot,
                {
                  backgroundColor: colors.text + "40",
                  width: scale(isDesktop ? 3 : 4),
                  height: scale(isDesktop ? 3 : 4),
                },
              ]}
            />

            <View style={styles.nameWrapper}>
              <CustomText
                style={[
                  styles.stageName,
                  {
                    color: colors.text,
                    fontSize: scale(isDesktop ? 12 : 16),
                    fontWeight: "600",
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {stageName}
              </CustomText>
            </View>
          </View>
        </View>
      </View>

      {/* Ünite Seçim Modalı */}
      <UnitListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentUnit={unitNumber}
        onSelectUnit={handleUnitSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: "transparent", // Gölgelerin doğru çalışması ve köşelerin kavisli olması için eklendi
  },
  imageContainer: {
    width: "100%",
    position: "relative",
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unitBadge: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    width: "100%",
  },
  progressContainer: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 4,
  },
  progressSegmentWrapper: {
    flex: 1,
    alignItems: "center",
  },
  progressSegment: {
    width: "100%",
  },
  stepLabel: {
    fontWeight: "500",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    marginTop: 2,
  },
  scoreText: {
    fontWeight: "700",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  nameWrapper: {
    flex: 1,
    alignItems: "center",
  },
  unitName: {
    textAlign: "center",
  },
  stageDot: {
    borderRadius: 2,
    marginHorizontal: 8,
  },
  stageName: {
    textAlign: "center",
  },
});
