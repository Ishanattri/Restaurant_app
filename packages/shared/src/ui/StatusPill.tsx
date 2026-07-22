import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { orderStatusColor, radius, spacing, typography } from "../theme";
import { OrderStatus } from "../types";

export function StatusPill({ status }: { status: OrderStatus }) {
  const { fg, bg, label } = orderStatusColor[status];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: { ...typography.captionBold },
});
