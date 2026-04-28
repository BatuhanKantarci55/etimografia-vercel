import { useTheme } from "@contexts/ThemeContext";
import { useResponsive } from "@hooks/useResponsive";
import React, { forwardRef, useCallback } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from "react-native";

interface PullToRefreshScrollProps extends ScrollViewProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  navbarHeight?: number;
}

const PullToRefreshScroll = forwardRef<ScrollView, PullToRefreshScrollProps>(
  ({ children, onRefresh, refreshing, navbarHeight = 0, ...props }, ref) => {
    const { colors } = useTheme();
    const { isWeb, scale } = useResponsive();

    const handleRefresh = useCallback(async () => {
      await onRefresh();
    }, [onRefresh]);

    if (isWeb || Platform.OS === "web") {
      return (
        <ScrollView
          ref={ref}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      );
    }

    const refreshOffset = navbarHeight + scale(30);

    return (
      <ScrollView
        ref={ref}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            title="Yenileniyor..."
            titleColor={colors.text}
            progressViewOffset={refreshOffset}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);

PullToRefreshScroll.displayName = "PullToRefreshScroll";

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

export default PullToRefreshScroll;
