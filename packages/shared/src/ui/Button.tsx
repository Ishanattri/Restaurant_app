import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { colors, radius, shadow, spacing, typography } from "../theme";

export type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = "primary", loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        variant === "primary" && !isDisabled && shadow.primary,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text` as const]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: "transparent", minHeight: 44 },
  disabled: { opacity: 0.45 },
  text: { ...typography.bodyBold, fontSize: 16, letterSpacing: 0.2 },
  primaryText: { color: colors.white },
  outlineText: { color: colors.primary },
  ghostText: { color: colors.textPrimary },
});
