import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = "🍽️", title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center", padding: spacing.xl },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
