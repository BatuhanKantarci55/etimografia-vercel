import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useAuth } from "@contexts/AuthContext";
import { useEducation } from "@contexts/EducationContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// JSON dosyalarını import et
import stagesData from "@assets/data/stages.json";
import unitsData from "@assets/data/units.json";

interface Unit {
  unit_number: number;
  unit_name: string;
}

interface UnitListModalProps {
  visible: boolean;
  onClose: () => void;
  currentUnit: number;
  onSelectUnit: (unitNumber: number) => void;
}

export default function UnitListModal({
  visible,
  onClose,
  currentUnit,
  onSelectUnit,
}: UnitListModalProps) {
  const { colors, themeMode } = useTheme();
  const { user } = useAuth();
  const { scale, isDesktop } = useResponsive();
  const { completedStages } = useEducation();

  const [selectedIndex, setSelectedIndex] = useState(currentUnit - 1);
  const [units] = useState<Unit[]>(unitsData as Unit[]);

  // Animasyon değerleri
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Temaya göre ünite görselini yükle
  const getUnitImage = (unitNumber: number) => {
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

  // Bir ünitenin tamamlanıp tamamlanmadığını kontrol et
  const isUnitCompleted = (unitNumber: number) => {
    if (!user) return false;

    const stagesInUnit = stagesData.filter(
      (stage: any) => stage.unit_number === unitNumber,
    ).length;

    const completedCount = completedStages.filter(
      (stage) => stage.unit_number === unitNumber,
    ).length;

    return completedCount === stagesInUnit && stagesInUnit > 0;
  };

  // Bir üniteye geçilip geçilmediğini kontrol et
  const isUnitUnlocked = (unitNumber: number) => {
    if (!user) return unitNumber === 1; // Giriş yapılmamışsa sadece Ünite 1 açık gözüksün.

    if (unitNumber === 1) return true;
    return isUnitCompleted(unitNumber - 1);
  };

  // Sol ok tıklandığında
  const handlePrev = () => {
    if (selectedIndex > 0) {
      // Önce fade out
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSelectedIndex(selectedIndex - 1);
        // Sonra fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Sağ ok tıklandığında
  const handleNext = () => {
    if (selectedIndex < units.length - 1) {
      // Önce fade out
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSelectedIndex(selectedIndex + 1);
        // Sonra fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Ünite durumuna göre mesaj
  const getUnitStatus = (unitNumber: number) => {
    if (unitNumber === currentUnit && user) {
      return {
        message: "Mevcut Ünite",
        color: colors.primary,
      };
    } else if (isUnitCompleted(unitNumber)) {
      return {
        message: "Tamamlandı",
        color: "#4CAF50",
      };
    } else if (isUnitUnlocked(unitNumber)) {
      return {
        message: user ? "Başlanabilir" : "Giriş Gerekli",
        color: colors.primary,
      };
    } else {
      return {
        message: "Bu üniteye geçilmedi",
        color: colors.text + "40",
      };
    }
  };

  const currentUnitData = units[selectedIndex];
  const currentUnitNumber = currentUnitData?.unit_number || 1;
  const status = getUnitStatus(currentUnitNumber);
  const isLocked = !isUnitUnlocked(currentUnitNumber);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Üniteler"
      height={isDesktop ? "auto" : "70%"}
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <View style={styles.container}>
        {/* Ünite Görseli ve Oklar */}
        <View style={styles.imageSection}>
          {/* Sol Ok - Görselin içinde solda */}
          <TouchableOpacity
            style={[
              styles.arrowButton,
              styles.leftArrow,
              {
                backgroundColor: "rgba(0,0,0,0.5)",
                opacity: selectedIndex > 0 ? 1 : 0.3,
                width: scale(isDesktop ? 34 : 44),
                height: scale(isDesktop ? 34 : 44),
                borderRadius: scale(isDesktop ? 17 : 22),
                transform: [{ translateY: scale(isDesktop ? -17 : -22) }],
              },
            ]}
            onPress={handlePrev}
            disabled={selectedIndex === 0}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={scale(isDesktop ? 20 : 30)}
              color="white"
            />
          </TouchableOpacity>

          {/* Ünite Görseli - Animasyonlu */}
          <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
            <Image
              source={getUnitImage(currentUnitNumber)}
              style={styles.unitImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)"]}
              style={styles.imageGradient}
            />

            {/* Kilitli üniteler için overlay */}
            {isLocked && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed" size={scale(40)} color="white" />
              </View>
            )}
          </Animated.View>

          {/* Sağ Ok - Görselin içinde sağda */}
          <TouchableOpacity
            style={[
              styles.arrowButton,
              styles.rightArrow,
              {
                backgroundColor: "rgba(0,0,0,0.5)",
                opacity: selectedIndex < units.length - 1 ? 1 : 0.3,
                width: scale(isDesktop ? 34 : 44),
                height: scale(isDesktop ? 34 : 44),
                borderRadius: scale(isDesktop ? 17 : 22),
                transform: [{ translateY: scale(isDesktop ? -17 : -22) }],
              },
            ]}
            onPress={handleNext}
            disabled={selectedIndex === units.length - 1}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={scale(isDesktop ? 20 : 30)}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Sayfa İndikatörü */}
        <View style={styles.paginationContainer}>
          {units.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === selectedIndex
                      ? colors.primary
                      : colors.text + "20",
                  width: index === selectedIndex ? scale(20) : scale(8),
                },
              ]}
            />
          ))}
        </View>

        {/* Ünite Bilgileri */}
        <View style={[styles.unitInfo, isDesktop && { paddingBottom: 20 }]}>
          <CustomText
            style={[
              styles.unitTitle,
              {
                color: colors.text,
                fontSize: scale(isDesktop ? 15 : 18),
              },
            ]}
          >
            Ünite {currentUnitNumber}: {currentUnitData?.unit_name}
          </CustomText>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: status.color + "20",
                paddingVertical: scale(isDesktop ? 4 : 6),
                paddingHorizontal: scale(isDesktop ? 12 : 16),
              },
            ]}
          >
            <CustomText
              style={[
                styles.statusText,
                {
                  color: status.color,
                  fontSize: scale(isDesktop ? 12 : 14),
                },
              ]}
            >
              {status.message}
            </CustomText>
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageSection: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 9,
    marginTop: 10,
    marginBottom: 20,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  unitImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lockedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  unitInfo: {
    width: "100%",
    alignItems: "center",
  },
  unitTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  statusBadge: {
    borderRadius: 20,
  },
  statusText: {
    fontWeight: "500",
  },
});
