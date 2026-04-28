import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface CompletionModalProps {
  visible: boolean;
  onClose: () => void;
  step: number;
  stats: {
    learning: number;
    known: number;
    total: number;
  };
  points?: {
    step1Points: number;
    step2Points: number;
    step3Points: number;
    totalPoints: number;
  };
  nextStep?: number;
  unitId?: number;
  stageId?: number;
  isLastStep?: boolean;
}

export default function CompletionModal({
  visible,
  onClose,
  step,
  stats,
  points,
  nextStep,
  unitId,
  stageId,
  isLastStep = false,
}: CompletionModalProps) {
  const { colors } = useTheme();
  // DEĞİŞİKLİK: isDesktop eklendi
  const { scale, isDesktop } = useResponsive();

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Öğrenme Adımı";
      case 2:
        return "Pekiştirme Adımı";
      case 3:
        return "Sınav Adımı";
      default:
        return "Adım";
    }
  };

  const getMessage = () => {
    if (step === 1) {
      return `Tebrikler! ${stats.learning} kelime öğrenmeye başladınız, ${stats.known} kelimeyi zaten biliyordunuz.`;
    } else if (step === 2) {
      return `Harika! ${stats.learning} kelimeyi pekiştirdiniz. Artık sınav adımına hazırsınız.`;
    } else {
      return `Mükemmel! ${stats.learning} kelimeyi başarıyla öğrendiniz. Bu aşamayı tamamladınız!`;
    }
  };

  // Sadece "Ana Sayfaya Dön" butonu için kullanılacak
  const handleHomePress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              // DEĞİŞİKLİK: Masaüstünde kavisler daha da küçültüldü
              borderRadius: scale(isDesktop ? 12 : 20),
              // DEĞİŞİKLİK: Masaüstünde iç boşluklar küçültüldü
              padding: scale(isDesktop ? 16 : 24),
            },
            // DEĞİŞİKLİK: Masaüstünde pencerenin yatay genişliği artırıldı
            isDesktop && {
              width: "60%",
              maxWidth: 550,
            },
          ]}
        >
          {/* Başarı İkonu */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.primary + "20",
                // DEĞİŞİKLİK: Masaüstünde ikon yuvarlağı küçültüldü
                width: scale(isDesktop ? 50 : 80),
                height: scale(isDesktop ? 50 : 80),
                borderRadius: scale(isDesktop ? 25 : 40),
                marginBottom: scale(isDesktop ? 10 : 16),
              },
            ]}
          >
            <Ionicons
              name="checkmark-done-circle"
              // DEĞİŞİKLİK: Masaüstünde onay ikonu küçültüldü
              size={scale(isDesktop ? 30 : 48)}
              color={colors.primary}
            />
          </View>

          {/* Başlık */}
          <CustomText
            style={[
              styles.title,
              {
                color: colors.text,
                // DEĞİŞİKLİK: Masaüstünde başlık metni küçültüldü
                fontSize: scale(isDesktop ? 16 : 24),
                marginBottom: scale(isDesktop ? 4 : 8),
              },
            ]}
          >
            {getStepTitle()} Tamamlandı!
          </CustomText>

          {/* Mesaj */}
          <CustomText
            style={[
              styles.message,
              {
                color: colors.text + "CC",
                // DEĞİŞİKLİK: Masaüstünde mesaj metni küçültüldü
                fontSize: scale(isDesktop ? 12 : 16),
                marginBottom: scale(isDesktop ? 16 : 24),
                textAlign: "center",
              },
            ]}
          >
            {getMessage()}
          </CustomText>

          {/* İstatistikler ve Puanlar */}
          <View
            style={[
              styles.statsContainer,
              {
                backgroundColor: colors.background,
                borderRadius: scale(12),
                // DEĞİŞİKLİK: Masaüstünde istatistik kutusu iç boşluk ve aralıkları küçültüldü
                padding: scale(isDesktop ? 10 : 16),
                marginBottom: scale(isDesktop ? 16 : 24),
                width: "100%",
              },
            ]}
          >
            {/* Kelime İstatistikleri */}
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="school"
                  // DEĞİŞİKLİK: İstatistik ikonu küçültüldü
                  size={scale(isDesktop ? 14 : 20)}
                  color={colors.primary}
                />
                <CustomText
                  style={[
                    styles.statLabel,
                    // DEĞİŞİKLİK: Etiket font boyutu küçültüldü
                    {
                      color: colors.text + "80",
                      fontSize: scale(isDesktop ? 10 : 12),
                    },
                  ]}
                >
                  Öğrenilecek
                </CustomText>
                <CustomText
                  style={[
                    styles.statValue,
                    // DEĞİŞİKLİK: Rakam font boyutu küçültüldü
                    {
                      color: colors.text,
                      fontSize: scale(isDesktop ? 14 : 18),
                    },
                  ]}
                >
                  {stats.learning}
                </CustomText>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={scale(isDesktop ? 14 : 20)}
                  color="#4CAF50"
                />
                <CustomText
                  style={[
                    styles.statLabel,
                    {
                      color: colors.text + "80",
                      fontSize: scale(isDesktop ? 10 : 12),
                    },
                  ]}
                >
                  Bilinen
                </CustomText>
                <CustomText
                  style={[
                    styles.statValue,
                    {
                      color: colors.text,
                      fontSize: scale(isDesktop ? 14 : 18),
                    },
                  ]}
                >
                  {stats.known}
                </CustomText>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons
                  name="book"
                  size={scale(isDesktop ? 14 : 20)}
                  color="#FFA500"
                />
                <CustomText
                  style={[
                    styles.statLabel,
                    {
                      color: colors.text + "80",
                      fontSize: scale(isDesktop ? 10 : 12),
                    },
                  ]}
                >
                  Toplam
                </CustomText>
                <CustomText
                  style={[
                    styles.statValue,
                    {
                      color: colors.text,
                      fontSize: scale(isDesktop ? 14 : 18),
                    },
                  ]}
                >
                  {stats.total}
                </CustomText>
              </View>
            </View>

            {/* Puan Bilgileri - Sadece puan varsa göster */}
            {points && points.totalPoints > 0 && (
              <>
                <View
                  style={[
                    styles.pointsDivider,
                    isDesktop && { marginVertical: 8 },
                  ]}
                />

                <View
                  style={[
                    styles.pointsContainer,
                    isDesktop && { marginTop: 2 },
                  ]}
                >
                  <CustomText
                    style={[
                      styles.pointsTitle,
                      // DEĞİŞİKLİK: Puan başlığı küçültüldü
                      {
                        color: colors.primary,
                        fontSize: scale(isDesktop ? 11 : 14),
                      },
                    ]}
                  >
                    KAZANILAN PUANLAR
                  </CustomText>

                  {points.step1Points > 0 && (
                    <View
                      style={[
                        styles.pointRow,
                        isDesktop && { marginBottom: 2 },
                      ]}
                    >
                      <CustomText
                        style={[
                          styles.pointLabel,
                          {
                            color: colors.text,
                            fontSize: scale(isDesktop ? 10 : 13),
                          },
                        ]}
                      >
                        Adım Tamamlama:
                      </CustomText>
                      <CustomText
                        style={[
                          styles.pointValue,
                          {
                            color: colors.primary,
                            fontSize: scale(isDesktop ? 11 : 14),
                          },
                        ]}
                      >
                        +{points.step1Points}
                      </CustomText>
                    </View>
                  )}

                  {points.step2Points > 0 && (
                    <View
                      style={[
                        styles.pointRow,
                        isDesktop && { marginBottom: 2 },
                      ]}
                    >
                      <CustomText
                        style={[
                          styles.pointLabel,
                          {
                            color: colors.text,
                            fontSize: scale(isDesktop ? 10 : 13),
                          },
                        ]}
                      >
                        Doğru Cevaplar (2p):
                      </CustomText>
                      <CustomText
                        style={[
                          styles.pointValue,
                          {
                            color: colors.primary,
                            fontSize: scale(isDesktop ? 11 : 14),
                          },
                        ]}
                      >
                        +{points.step2Points}
                      </CustomText>
                    </View>
                  )}

                  {points.step3Points > 0 && (
                    <View
                      style={[
                        styles.pointRow,
                        isDesktop && { marginBottom: 2 },
                      ]}
                    >
                      <CustomText
                        style={[
                          styles.pointLabel,
                          {
                            color: colors.text,
                            fontSize: scale(isDesktop ? 10 : 13),
                          },
                        ]}
                      >
                        Zorluk Bonusu:
                      </CustomText>
                      <CustomText
                        style={[
                          styles.pointValue,
                          {
                            color: colors.primary,
                            fontSize: scale(isDesktop ? 11 : 14),
                          },
                        ]}
                      >
                        +{points.step3Points}
                      </CustomText>
                    </View>
                  )}

                  <View
                    style={[
                      styles.totalPointRow,
                      isDesktop && { marginTop: 4, paddingTop: 4 },
                    ]}
                  >
                    <CustomText
                      style={[
                        styles.totalPointLabel,
                        {
                          color: colors.text,
                          fontWeight: "bold",
                          fontSize: scale(isDesktop ? 12 : 15),
                        },
                      ]}
                    >
                      TOPLAM:
                    </CustomText>
                    <CustomText
                      style={[
                        styles.totalPointValue,
                        {
                          color: colors.primary,
                          fontWeight: "bold",
                          // DEĞİŞİKLİK: Toplam puan rakamı küçültüldü
                          fontSize: scale(isDesktop ? 16 : 20),
                        },
                      ]}
                    >
                      +{points.totalPoints}
                    </CustomText>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Butonlar */}
          <View style={styles.buttonContainer}>
            {!isLastStep && nextStep ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.nextButton,
                  {
                    backgroundColor: colors.primary,
                    // DEĞİŞİKLİK: Masaüstünde buton iç boşluğu ve kavisleri küçültüldü
                    paddingVertical: scale(isDesktop ? 10 : 14),
                    borderRadius: scale(isDesktop ? 16 : 28),
                    flex: 1,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <CustomText
                  style={[
                    styles.buttonText,
                    // DEĞİŞİKLİK: Masaüstünde buton yazısı küçültüldü
                    { color: "white", fontSize: scale(isDesktop ? 13 : 16) },
                  ]}
                >
                  {step === 1
                    ? "2. Adıma Geç"
                    : step === 2
                      ? "3. Adıma Geç"
                      : "Tamamla"}
                </CustomText>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.button,
                styles.homeButton,
                {
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  // DEĞİŞİKLİK: Masaüstünde buton iç boşluğu ve kavisleri küçültüldü
                  paddingVertical: scale(isDesktop ? 10 : 14),
                  borderRadius: scale(isDesktop ? 16 : 28),
                  flex: isLastStep || !nextStep ? 1 : undefined,
                  marginLeft: !isLastStep && nextStep ? scale(12) : 0,
                },
              ]}
              onPress={handleHomePress}
              activeOpacity={0.8}
            >
              <CustomText
                style={[
                  styles.buttonText,
                  { color: colors.text, fontSize: scale(isDesktop ? 13 : 16) },
                ]}
              >
                Ana Sayfaya Dön
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    lineHeight: 22,
  },
  statsContainer: {
    width: "100%",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontWeight: "bold",
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  pointsDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 12,
  },
  pointsContainer: {
    width: "100%",
    marginTop: 4,
  },
  pointsTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  pointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  pointLabel: {
    // fontSize inline verildi
  },
  pointValue: {
    fontWeight: "600",
  },
  totalPointRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  totalPointLabel: {
    // fontSize inline verildi
  },
  totalPointValue: {
    // fontSize inline verildi
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  homeButton: {},
  buttonText: {
    fontWeight: "600",
  },
});
