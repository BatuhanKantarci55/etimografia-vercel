import BottomSheetModal from "@components/BottomSheetModal";
import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface SavedExercisesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SavedExercisesModal({
  visible,
  onClose,
}: SavedExercisesModalProps) {
  const { colors } = useTheme();
  const { scale } = useResponsive();

  // Example saved exercises
  const savedExercises = [
    { id: 1, name: "Arabic Origin Words", count: 24, progress: 75 },
    { id: 2, name: "Difficulty 5 Words", count: 15, progress: 60 },
    { id: 3, name: "Unit 3 Words", count: 32, progress: 40 },
    { id: 4, name: "Newly Learned", count: 8, progress: 20 },
  ];

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Saved Exercises"
      height="60%"
      showCloseButton={true}
      showDragHandle={true}
      closeOnBackdropPress={true}
      closeOnSwipeDown={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {savedExercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseItem,
              {
                backgroundColor: colors.card,
                padding: scale(16),
                borderRadius: scale(12),
                marginBottom: scale(12),
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <CustomText
                  style={{
                    fontSize: scale(16),
                    color: colors.text,
                    fontWeight: "500",
                  }}
                >
                  {exercise.name}
                </CustomText>
                <CustomText
                  style={{
                    fontSize: scale(14),
                    color: colors.text + "60",
                    marginTop: scale(4),
                  }}
                >
                  {exercise.count} words
                </CustomText>
              </View>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  {
                    backgroundColor: colors.primary,
                    width: scale(44),
                    height: scale(44),
                    borderRadius: scale(22),
                  },
                ]}
              >
                <Ionicons name="play" size={scale(20)} color="white" />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View
              style={[
                styles.progressContainer,
                {
                  backgroundColor: colors.background,
                  height: scale(8),
                  borderRadius: scale(4),
                  marginTop: scale(12),
                  overflow: "hidden",
                },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.primary,
                    width: `${exercise.progress}%`,
                    height: "100%",
                  },
                ]}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: scale(8),
              }}
            >
              <CustomText
                style={{
                  fontSize: scale(12),
                  color: colors.text + "60",
                }}
              >
                Completion
              </CustomText>
              <CustomText
                style={{
                  fontSize: scale(12),
                  color: colors.primary,
                  fontWeight: "600",
                }}
              >
                %{exercise.progress}
              </CustomText>
            </View>
          </TouchableOpacity>
        ))}

        {/* Create New Exercise Button */}
        <TouchableOpacity
          style={[
            styles.newExerciseButton,
            {
              backgroundColor: colors.primary + "10",
              padding: scale(16),
              borderRadius: scale(12),
              marginTop: scale(8),
              borderWidth: 2,
              borderColor: colors.primary + "30",
              borderStyle: "dashed",
            },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={scale(24)}
              color={colors.primary}
              style={{ marginRight: scale(12) }}
            />
            <CustomText
              style={{
                fontSize: scale(16),
                color: colors.primary,
                fontWeight: "600",
              }}
            >
              Create New Exercise
            </CustomText>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exerciseItem: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 12,
  },
  playButton: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  progressContainer: {
    overflow: "hidden",
  },
  progressBar: {
    borderRadius: 4,
  },
  newExerciseButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
});
