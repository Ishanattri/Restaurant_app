import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadow, spacing, typography } from "../theme";
import { NotificationPayload } from "../socket";

interface NotificationBannerProps {
  notification: NotificationPayload | null;
  onHide: () => void;
  onPress?: (notification: NotificationPayload) => void;
  topOffset?: number;
  autoHideMs?: number;
}

export function NotificationBanner({
  notification,
  onHide,
  onPress,
  topOffset = 0,
  autoHideMs = 4500,
}: NotificationBannerProps) {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!notification) return;

    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();

    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -120, duration: 220, useNativeDriver: true }).start(onHide);
    }, autoHideMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification]);

  if (!notification) return null;

  return (
    <Animated.View
      style={[styles.wrapper, { top: topOffset, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => onPress?.(notification)}
      >
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.floating,
  },
  title: { ...typography.bodyBold, color: colors.textPrimary },
  body: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
