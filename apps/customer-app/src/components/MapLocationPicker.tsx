import { Button, colors, spacing, typography } from "@restaurant-app/shared";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Region } from "react-native-maps";

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

const DEFAULT_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Native implementation (iOS/Android). A separate MapLocationPicker.web.tsx provides
// the web fallback, since react-native-maps has no web renderer — Metro resolves
// the .web.tsx variant automatically when bundling for the web platform.
export function MapLocationPicker({ visible, initialLocation, onConfirm, onCancel }: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [addressPreview, setAddressPreview] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Re-initialize every time the picker opens: start from a saved pin if there is
  // one, otherwise auto-detect the device's current location right away.
  useEffect(() => {
    if (!visible) return;
    setPermissionDenied(false);
    if (initialLocation) {
      const next = {
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(next);
      moveMapTo(next);
      resolveAddress(next.latitude, next.longitude);
    } else {
      centerOnCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function moveMapTo(next: Region) {
    // A short delay lets the MapView finish mounting before we animate it —
    // calling animateToRegion immediately after mount can be a no-op on Android.
    setTimeout(() => mapRef.current?.animateToRegion(next, 500), 50);
  }

  async function resolveAddress(lat: number, lng: number) {
    setResolving(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (place) {
        setAddressPreview([place.name || place.street, place.district, place.city].filter(Boolean).join(", "));
      } else {
        setAddressPreview(null);
      }
    } catch {
      setAddressPreview(null);
    } finally {
      setResolving(false);
    }
  }

  async function centerOnCurrentLocation() {
    setLocating(true);
    setPermissionDenied(false);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(next);
      moveMapTo(next);
      resolveAddress(next.latitude, next.longitude);
    } finally {
      setLocating(false);
    }
  }

  function handleConfirm() {
    const [line1, ...rest] = (addressPreview ?? "").split(", ");
    onConfirm({
      lat: region.latitude,
      lng: region.longitude,
      addressLine: line1 || undefined,
      city: rest.length > 0 ? rest[rest.length - 1] : undefined,
    });
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

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={(next) => {
              setRegion(next);
              resolveAddress(next.latitude, next.longitude);
            }}
          />
          <View pointerEvents="none" style={styles.pinWrap}>
            <Text style={styles.pin}>📍</Text>
          </View>

          <TouchableOpacity
            style={styles.locateFab}
            onPress={centerOnCurrentLocation}
            disabled={locating}
            activeOpacity={0.8}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.locateFabIcon}>🎯</Text>
            )}
          </TouchableOpacity>
        </View>

        {permissionDenied ? (
          <Text style={styles.permissionWarning}>
            Location permission denied — enable it in Settings, or drag the map to position the pin manually.
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.addressPreview} numberOfLines={2}>
            {resolving ? "Finding address…" : addressPreview || "Move the map to position the pin"}
          </Text>
          <Button title="Confirm this location" onPress={handleConfirm} />
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
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  pinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -36,
    alignItems: "center",
  },
  pin: { fontSize: 36 },
  locateFab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  locateFabIcon: { fontSize: 20 },
  permissionWarning: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  footer: { padding: spacing.lg, gap: spacing.sm },
  addressPreview: { ...typography.body, color: colors.textPrimary, textAlign: "center", minHeight: 40 },
});
