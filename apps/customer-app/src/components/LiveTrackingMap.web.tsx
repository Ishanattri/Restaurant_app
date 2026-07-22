import { Address, colors, Restaurant, spacing, typography } from "@restaurant-app/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RiderLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

interface LiveTrackingMapProps {
  restaurant: Restaurant;
  deliveryAddress: Address;
  riderLocation: RiderLocation | null;
}

// react-native-maps has no web renderer, so the web build shows the same
// live data (restaurant, delivery address, rider coordinates) without a map.
export function LiveTrackingMap({ restaurant, deliveryAddress, riderLocation }: LiveTrackingMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Live tracking</Text>
      <Text style={styles.note}>Map view is available on the iOS/Android app</Text>

      <View style={styles.row}>
        <Text style={styles.dot}>🟠</Text>
        <Text style={styles.label}>{restaurant.name}</Text>
        <Text style={styles.coords}>
          {restaurant.lat.toFixed(4)}, {restaurant.lng.toFixed(4)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.dot}>🔴</Text>
        <Text style={styles.label}>{deliveryAddress.label}</Text>
        <Text style={styles.coords}>
          {deliveryAddress.lat.toFixed(4)}, {deliveryAddress.lng.toFixed(4)}
        </Text>
      </View>
      {riderLocation ? (
        <View style={styles.row}>
          <Text style={styles.dot}>🟢</Text>
          <Text style={styles.label}>Your rider</Text>
          <Text style={styles.coords}>
            {riderLocation.lat.toFixed(4)}, {riderLocation.lng.toFixed(4)}
          </Text>
        </View>
      ) : (
        <Text style={styles.waitingLabel}>Waiting for rider location…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  note: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  dot: { fontSize: 12 },
  label: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  coords: { ...typography.caption, color: colors.textSecondary },
  waitingLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});
