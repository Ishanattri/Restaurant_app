import React, { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../theme";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function Header({ title, onBack, right }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.back}>{"‹"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  side: { width: 40, justifyContent: "center" },
  right: { alignItems: "flex-end" },
  back: { fontSize: 32, color: colors.textPrimary, lineHeight: 32 },
  title: { ...typography.h3, flex: 1, textAlign: "center", color: colors.textPrimary },
});
