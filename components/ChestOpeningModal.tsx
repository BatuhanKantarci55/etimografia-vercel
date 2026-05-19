import { ResizeMode, Video } from "expo-av";
import React, { useRef, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import CustomText from "./CustomText";
import DiamondRewardModal from "./DiamondRewardModal";
import GoldRewardModal from "./GoldRewardModal";

interface ChestOpeningModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export default function ChestOpeningModal({
  visible,
  level,
  onClose,
}: ChestOpeningModalProps) {
  const { colors } = useTheme();
  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [showDiamondModal, setShowDiamondModal] = useState(false);
  const [goldCompleted, setGoldCompleted] = useState(false);

  const handleScreenTap = async () => {
    if (videoStatus.isLoaded && !videoStatus.isPlaying) {
      await videoRef.current?.playAsync();
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    setVideoStatus(status);
    if (status.didJustFinish) {
      // Video bitti, sandık açıldı, altın ödülüne geç
      setShowGoldModal(true);
    }
  };

  const handleGoldComplete = () => {
    setShowGoldModal(false);
    setGoldCompleted(true);
    setShowDiamondModal(true);
  };

  const handleDiamondComplete = async () => {
    setShowDiamondModal(false);
    onClose(); // Tüm ödül süreci bitti
  };

  // Video görseli duraklatılmış halde göster
  return (
    <>
      <Modal
        visible={visible && !showGoldModal && !showDiamondModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.8)" }]}
          activeOpacity={1}
          onPress={handleScreenTap}
        >
          <View style={styles.chestContainer}>
            <Video
              ref={videoRef}
              source={require("../assets/images/chests/mixed/opening.mp4")}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />
            {!videoStatus.isPlaying && (
              <CustomText style={[styles.tapText, { color: colors.text }]}>
                Ekranda herhangi bir yere dokunun
              </CustomText>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <GoldRewardModal
        visible={showGoldModal}
        onComplete={handleGoldComplete}
        level={level}
      />

      <DiamondRewardModal
        visible={showDiamondModal}
        onComplete={handleDiamondComplete}
        level={level}
        goldCompleted={goldCompleted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chestContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
  },
  video: {
    width: 300,
    height: 300,
    backgroundColor: "transparent",
  },
  tapText: {
    marginTop: 30,
    fontSize: 16,
    textAlign: "center",
  },
});
