import { useTheme } from "@contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "@hooks/useResponsive";
import ProfileContent from "components/Profile/ProfileContent";
import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 40;

interface ProfileTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  onSwipe: (tab: string) => void;
}

export interface ProfileTabsRef {
  scrollToIndex: (index: number) => void;
}

const tabs = [
  { key: "gönderi", icon: "newspaper-outline" as const },
  { key: "takipçi", icon: "people-outline" as const }, // "arkadaş" -> "takipçi"
  { key: "rozet", icon: "ribbon-outline" as const },
  { key: "sıralama", icon: "trophy-outline" as const },
];

const ProfileTabs = forwardRef<ProfileTabsRef, ProfileTabsProps>(
  ({ activeTab, onTabPress, onSwipe }, ref) => {
    const { colors } = useTheme();
    const { scale } = useResponsive();
    const flatListRef = useRef<FlatList>(null);
    const isProgrammatic = useRef(false);

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number) => {
        isProgrammatic.current = true;
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
        });
      },
    }));

    const handleMomentumEnd = (e: any) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / CONTENT_WIDTH);
      const tab = tabs[index]?.key;

      if (tab && tab !== activeTab) {
        onSwipe(tab);
      }
      isProgrammatic.current = false;
    };

    const handleIconPress = (index: number, key: string) => {
      onTabPress(key);
      isProgrammatic.current = true;
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    };

    return (
      <View style={{ flex: 1 }}>
        {/* ICON BAR */}
        <View style={styles.tabBar}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleIconPress(index, tab.key)}
              style={[
                styles.tabItem,
                {
                  backgroundColor:
                    activeTab === tab.key
                      ? colors.primary + "20"
                      : "transparent",
                },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={scale(24)}
                color={
                  activeTab === tab.key ? colors.primary : colors.text + "80"
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTENT */}
        <FlatList
          ref={flatListRef}
          data={tabs}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          directionalLockEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CONTENT_WIDTH}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumEnd}
          getItemLayout={(_, index) => ({
            length: CONTENT_WIDTH,
            offset: CONTENT_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={{ width: CONTENT_WIDTH }}>
              <ProfileContent tabKey={item.key} />
            </View>
          )}
        />
      </View>
    );
  },
);

ProfileTabs.displayName = "ProfileTabs";

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tabItem: {
    padding: 10,
    borderRadius: 20,
  },
});

export default ProfileTabs;
