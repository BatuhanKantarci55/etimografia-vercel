import CustomText from "@components/CustomText";
import { usePosts } from "@contexts/PostContext";
import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import { ResizeMode, Video } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Basit ImageViewer
const ImageViewer = ({
  visible,
  imageUri,
  onClose,
}: {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.viewerOverlay}>
        <TouchableOpacity style={styles.viewerCloseButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUri }}
          style={styles.viewerImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

interface PostContentProps {
  content: {
    text?: string | null;
    image?: string | null;
    video?: string | null;
    poll?: {
      question: string;
      options: Array<{ id: number; text: string; votes: number }>;
    } | null;
    type: "text" | "image" | "video" | "poll";
  };
  postId?: string;
  userVotedOption?: number | null;
  isQuoted?: boolean;
}

export default function PostContent({
  content,
  postId,
  userVotedOption,
  isQuoted,
}: PostContentProps) {
  const { colors } = useTheme();
  const { scale, isDesktop } = useResponsive();
  const { votePoll } = usePosts();
  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(
    userVotedOption || null,
  );
  const [pollData, setPollData] = useState(content.poll);
  const [loading, setLoading] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    setSelectedPollOption(userVotedOption || null);
  }, [userVotedOption]);

  useEffect(() => {
    setPollData(content.poll);
  }, [content.poll]);

  const handleVote = async (optionId: number) => {
    if (!postId) return;

    if (selectedPollOption === optionId) {
      Alert.alert(
        "Oy Kaldır",
        "Bu seçeneğe verdiğiniz oyu kaldırmak istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Kaldır",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              const { error } = await votePoll(postId, -1);
              setLoading(false);

              if (error) {
                Alert.alert(
                  "Hata",
                  error.message || "Oy kaldırılırken bir hata oluştu",
                );
              } else {
                setSelectedPollOption(null);
              }
            },
          },
        ],
      );
      return;
    }

    setLoading(true);
    const { error } = await votePoll(postId, optionId);
    setLoading(false);

    if (error) {
      Alert.alert("Hata", error.message || "Oy verilirken bir hata oluştu");
    } else {
      setSelectedPollOption(optionId);
    }
  };

  const renderText = () => (
    <View
      style={[
        styles.textContainer,
        {
          paddingHorizontal: scale(isDesktop ? 13 : 16),
          paddingVertical: scale(isDesktop ? 3 : 16),
        },
      ]}
    >
      <CustomText
        fontFamily="medium"
        style={{
          fontSize: scale(isDesktop ? 10 : 15),
          color: colors.text,
        }}
      >
        {content.text || ""}
      </CustomText>
    </View>
  );

  const renderImage = () => (
    <View style={[styles.mediaContainer, isDesktop && { marginTop: scale(0) }]}>
      {content.image ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setImageViewerVisible(true)}
          style={{ width: "100%" }}
        >
          <Image
            source={{ uri: content.image }}
            style={[
              styles.image,
              { height: isDesktop ? scale(350) : SCREEN_WIDTH },
            ]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : null}

      {content.image && (
        <ImageViewer
          imageUri={content.image}
          visible={imageViewerVisible}
          onClose={() => setImageViewerVisible(false)}
        />
      )}

      {/* DÜZELTME: Görsel açıklama metni burada tamamen kaldırıldı, bu işi artık PostActions ve PostItem bileşenleri üstleniyor */}
    </View>
  );

  const renderVideo = () => {
    const videoUri =
      content.video ||
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

    return (
      <View
        style={[styles.mediaContainer, isDesktop && { marginTop: scale(0) }]}
      >
        <TouchableOpacity activeOpacity={0.9} style={{ width: "100%" }}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={[
              styles.video,
              { height: isDesktop ? scale(340) : SCREEN_WIDTH },
            ]}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            isLooping={false}
            shouldPlay={false}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.videoOverlay}
          onPress={async () => {
            if (videoRef.current) {
              const status = await videoRef.current.getStatusAsync();
              if (status.isLoaded) {
                if (status.isPlaying) {
                  await videoRef.current.pauseAsync();
                } else {
                  await videoRef.current.playAsync();
                }
              }
            }
          }}
        >
          <Ionicons
            name="play-circle"
            size={scale(48)}
            color="rgba(255,255,255,0.8)"
          />
        </TouchableOpacity>

        {/* DÜZELTME: Video açıklama metni de tamamen kaldırıldı */}
      </View>
    );
  };

  const renderPoll = () => {
    if (!pollData) return null;

    const totalVotes = pollData.options.reduce(
      (sum, option) => sum + option.votes,
      0,
    );

    const hasVoted = selectedPollOption !== null;

    return (
      <View
        style={[
          styles.pollContainer,
          {
            paddingHorizontal: scale(isDesktop ? 13 : 16),
            paddingVertical: scale(isDesktop ? 6 : 16),
          },
        ]}
      >
        <CustomText
          fontFamily="medium" // DÜZELTME: Anket fontu medium yapıldı
          style={{
            fontSize: isQuoted
              ? scale(isDesktop ? 10 : 14)
              : scale(isDesktop ? 10 : 16),
            color: colors.text,
            marginBottom: scale(isDesktop ? 4 : 12),
          }}
        >
          {pollData.question}
        </CustomText>

        {pollData.options.map((option) => {
          const percentage = totalVotes
            ? Math.round((option.votes / totalVotes) * 100)
            : 0;
          const isSelected = selectedPollOption === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.pollOption,
                {
                  backgroundColor: isSelected
                    ? colors.primary + "20"
                    : colors.card + "80",
                  borderColor: isSelected ? colors.primary : "transparent",
                  borderWidth: 1,
                  marginBottom: scale(isDesktop ? 2 : 8),
                  padding: scale(isDesktop ? 5 : 12),
                  borderRadius: scale(8),
                },
              ]}
              onPress={() => handleVote(option.id)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.pollBar,
                  {
                    backgroundColor: colors.primary + "40",
                    width: `${percentage}%`,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    borderRadius: scale(8),
                  },
                ]}
              />
              <View style={styles.pollOptionContent}>
                <CustomText
                  fontFamily="medium" // DÜZELTME: Şıkların fontu medium yapıldı
                  style={{
                    fontSize: isQuoted
                      ? scale(isDesktop ? 10 : 12)
                      : scale(isDesktop ? 10 : 14),
                    color: isSelected ? colors.primary : colors.text,
                  }}
                >
                  {option.text}
                </CustomText>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={scale(isDesktop ? 12 : 14)}
                      color={colors.primary}
                      style={{ marginRight: scale(4) }}
                    />
                  )}
                  <CustomText
                    fontFamily="medium" // DÜZELTME: Yüzde fontu medium yapıldı
                    style={{
                      fontSize: isQuoted
                        ? scale(isDesktop ? 10 : 11)
                        : scale(isDesktop ? 10 : 12),
                      color: colors.text + "60",
                    }}
                  >
                    {percentage}% ({option.votes} oy)
                  </CustomText>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View
          style={[styles.pollFooter, { marginTop: scale(isDesktop ? 0 : 8) }]}
        >
          <CustomText
            fontFamily="medium" // DÜZELTME: Alt bilgi fontu medium yapıldı
            style={{
              fontSize: isQuoted
                ? scale(isDesktop ? 10 : 11)
                : scale(isDesktop ? 10 : 12),
              color: colors.text + "60",
            }}
          >
            Toplam {totalVotes} oy
          </CustomText>

          {hasVoted && (
            <TouchableOpacity
              onPress={async () => {
                Alert.alert(
                  "Oy Kaldır",
                  "Verdiğiniz oyu kaldırmak istediğinize emin misiniz?",
                  [
                    { text: "İptal", style: "cancel" },
                    {
                      text: "Kaldır",
                      style: "destructive",
                      onPress: async () => {
                        setLoading(true);
                        const { error } = await votePoll(postId!, -1);
                        setLoading(false);

                        if (error) {
                          Alert.alert(
                            "Hata",
                            error.message || "Oy kaldırılırken bir hata oluştu",
                          );
                        } else {
                          setSelectedPollOption(null);
                        }
                      },
                    },
                  ],
                );
              }}
              style={styles.removeVoteButton}
            >
              <Ionicons
                name="close-circle"
                size={scale(isDesktop ? 12 : 14)}
                color={colors.text + "60"}
              />
              <CustomText
                fontFamily="medium"
                style={{
                  fontSize: scale(isDesktop ? 10 : 11),
                  color: colors.text + "60",
                  marginLeft: scale(4),
                }}
              >
                Oyu Kaldır
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      {content.type === "text" && renderText()}
      {content.type === "image" && renderImage()}
      {content.type === "video" && renderVideo()}
      {content.type === "poll" && renderPoll()}
    </>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    backgroundColor: "transparent",
  },
  mediaContainer: {
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
  },
  video: {
    width: "100%",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  imageCaption: {
    width: "100%",
  },
  videoCaption: {
    width: "100%",
  },
  pollContainer: {
    backgroundColor: "transparent",
  },
  pollOption: {
    position: "relative",
    overflow: "hidden",
  },
  pollOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  pollBar: {
    zIndex: 0,
  },
  pollFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  removeVoteButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
  viewerCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
});
