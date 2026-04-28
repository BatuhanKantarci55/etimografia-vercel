import CustomText from "@components/CustomText";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number | string;
  showCloseButton?: boolean;
  showDragHandle?: boolean;
  closeOnBackdropPress?: boolean;
  closeOnSwipeDown?: boolean;
  animationDuration?: number;
  safeAreaBottom?: boolean;
  desktopWidth?: number | string;
}

export default function BottomSheetModal({
  visible,
  onClose,
  title,
  children,
  height = "60%",
  showCloseButton = true,
  showDragHandle = true,
  closeOnBackdropPress = true,
  closeOnSwipeDown = true,
  animationDuration = 300,
  safeAreaBottom = true,
  desktopWidth,
}: BottomSheetModalProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const translateYStart = isDesktop ? 50 : SCREEN_HEIGHT;

  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(translateYStart)).current;

  const [isAnimating, setIsAnimating] = useState(false);
  const [modalVisible, setModalVisible] = useState(visible);
  const [pendingClose, setPendingClose] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
    } else {
      if (modalVisible) {
        closeWithAnimation();
      } else {
        setPendingClose(true);
      }
    }
  }, [visible]);

  useEffect(() => {
    if (pendingClose && !modalVisible && !isAnimating) {
      setPendingClose(false);
      onClose();
    }
  }, [pendingClose, modalVisible, isAnimating]);

  const getHeightValue = () => {
    let calculatedHeight: number;

    if (typeof height === "string" && height.includes("%")) {
      const percent = parseInt(height);
      calculatedHeight = windowHeight * (percent / 100);
    } else {
      calculatedHeight =
        typeof height === "number" ? height : windowHeight * 0.6;
    }

    if (safeAreaBottom && Platform.OS === "ios") {
      calculatedHeight += insets.bottom;
    }

    return calculatedHeight;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return closeOnSwipeDown && gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (closeOnSwipeDown && gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (
          closeOnSwipeDown &&
          (gestureState.dy > 100 || gestureState.vy > 0.5)
        ) {
          closeWithAnimation();
        } else if (closeOnSwipeDown) {
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 70,
            friction: 12,
          }).start();
        }
      },
    }),
  ).current;

  const openWithAnimation = () => {
    setIsAnimating(true);

    modalOpacity.setValue(0);
    modalTranslateY.setValue(translateYStart);

    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const closeWithAnimation = () => {
    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: animationDuration - 100,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: translateYStart,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      setModalVisible(false);
      onClose();
    });
  };

  useEffect(() => {
    if (modalVisible && !isAnimating) {
      openWithAnimation();
    }
  }, [modalVisible]);

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      closeWithAnimation();
    }
  };

  const modalHeight = getHeightValue();

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={closeWithAnimation}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: modalOpacity,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: isDesktop ? "center" : "flex-end",
              alignItems: isDesktop ? "center" : undefined,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.background,
                  transform: [{ translateY: modalTranslateY }],
                  height: isDesktop ? "auto" : modalHeight,
                  maxHeight: isDesktop ? "85%" : undefined,
                  width: (isDesktop
                    ? desktopWidth || scale(450)
                    : "100%") as any,
                  borderRadius: isDesktop ? 24 : 20,
                  paddingBottom: isDesktop
                    ? 20
                    : safeAreaBottom
                      ? insets.bottom
                      : 0,
                },
              ]}
              {...(closeOnSwipeDown && !isDesktop
                ? panResponder.panHandlers
                : {})}
            >
              {showDragHandle && !isDesktop && (
                <View style={styles.dragHandleContainer}>
                  <View
                    style={[
                      styles.dragHandle,
                      { backgroundColor: colors.text + "40" },
                    ]}
                  />
                </View>
              )}

              {(title || showCloseButton) && (
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: colors.card + "40" },
                  ]}
                >
                  {title && (
                    <View style={styles.titleContainer}>
                      <CustomText
                        style={[
                          styles.modalTitle,
                          {
                            color: colors.text,
                            // DÜZELTME: Masaüstü için modal başlığı daha da küçültüldü (13 -> 11)
                            fontSize: scale(isDesktop ? 11 : 20),
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {title}
                      </CustomText>
                    </View>
                  )}

                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={closeWithAnimation}
                      style={styles.closeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close"
                        size={scale(isDesktop ? 16 : 24)}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View
                style={[
                  styles.contentContainer,
                  !isDesktop && { flex: 1 },
                  isDesktop && { flexShrink: 1, overflow: "hidden" },
                ]}
              >
                {children}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    overflow: "hidden",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 5,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    minHeight: 50,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  modalTitle: {
    fontWeight: "600",
  },
  closeButton: {
    padding: 5,
    marginLeft: "auto",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
});
