import { Button, colors, spacing, typography } from "@restaurant-app/shared";
import * as Location from "expo-location";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface PickedLocation {
  lat: number;
  lng: number;
  addressLine?: string;
  city?: string;
}

interface Props {
  visible: boolean;
  initialLocation?: { lat: number; lng: number } | null;
  onConfirm: (location: PickedLocation) => void;
  onCancel: () => void;
}

// react-native-maps has no web renderer, so the web build falls back to a plain
// GPS capture button instead of a draggable pin.
export function MapLocationPicker({ visible, onConfirm, onCancel }: Props) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleUseCurrentLocation() {
    setError(undefined);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Location permission is required");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      onConfirm({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      setError("Could not get your location — try again");
    } finally {
      setLocating(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Pin your location</Text>
          <Text style={styles.cancelText} onPress={onCancel}>
            Cancel
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.note}>Interactive map pinning is available on the iOS/Android app.</Text>
          <Button
            title={locating ? "Locating…" : "Use my current location"}
            onPress={handleUseCurrentLocation}
            loading={locating}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  cancelText: { ...typography.bodyBold, color: colors.primary },
  body: { flex: 1, justifyContent: "center", padding: spacing.lg, gap: spacing.md },
  note: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.sm },
  error: { color: colors.danger, textAlign: "center" },
});
