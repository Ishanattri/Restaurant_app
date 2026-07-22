import React, { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, shadow, spacing } from "../theme";

interface CardProps {
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: PropsWithChildren<CardProps>) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: spacing.md },
});
