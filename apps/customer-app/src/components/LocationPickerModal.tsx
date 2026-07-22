import { apiErrorMessage, Button, colors, Input, spacing, typography } from "@restaurant-app/shared";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocationContext } from "../context/LocationContext";
import { MapLocationPicker, PickedLocation } from "./MapLocationPicker";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LocationPickerModal({ visible, onClose }: Props) {
  const { addresses, selectedAddressId, selectAddress, addAddress } = useLocationContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [newLocation, setNewLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function reset() {
    setShowAddForm(false);
    setLabel("Home");
    setLine1("");
    setCity("");
    setPhone("");
    setNewLocation(null);
    setError(undefined);
  }

  function handleMapConfirm(picked: PickedLocation) {
    setNewLocation({ lat: picked.lat, lng: picked.lng });
    if (picked.addressLine && !line1) setLine1(picked.addressLine);
    if (picked.city && !city) setCity(picked.city);
    setShowMapPicker(false);
  }

  async function handleSave() {
    if (!newLocation) return;
    setError(undefined);
    setSaving(true);
    try {
      await addAddress({
        label: label.trim() || "Home",
        line1: line1.trim(),
        city: city.trim(),
        phone: phone.trim(),
        lat: newLocation.lat,
        lng: newLocation.lng,
      });
      reset();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save address"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Deliver to</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {addresses.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardSelected]}
              onPress={() => {
                selectAddress(addr.id);
                onClose();
              }}
            >
              <Text style={styles.addressLabel}>{addr.label}</Text>
              <Text style={styles.addressLine}>
                {addr.line1}, {addr.city}
              </Text>
            </TouchableOpacity>
          ))}

          {showAddForm ? (
            <View style={styles.addForm}>
              <Input label="Label" value={label} onChangeText={setLabel} placeholder="Home, Work..." />
              <Input label="Address line" value={line1} onChangeText={setLine1} placeholder="Street address" />
              <Input label="City" value={city} onChangeText={setCity} placeholder="City" />
              <Input
                label="Contact phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="For the restaurant & rider to reach you"
                keyboardType="phone-pad"
              />
              <Button
                title={newLocation ? "📍 Location pinned ✓" : "📍 Pick on map"}
                variant="outline"
                onPress={() => setShowMapPicker(true)}
                style={styles.locationButton}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                title="Save address"
                onPress={handleSave}
                loading={saving}
                disabled={!line1 || !city || phone.trim().length < 7 || !newLocation}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowAddForm(true)}>
              <Text style={styles.addAddressLink}>+ Add new address</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      <MapLocationPicker
        visible={showMapPicker}
        initialLocation={newLocation}
        onConfirm={handleMapConfirm}
        onCancel={() => setShowMapPicker(false)}
      />
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
  closeText: { ...typography.bodyBold, color: colors.primary },
  content: { padding: spacing.lg, gap: spacing.sm },
  addressCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  addressCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  addressLabel: { ...typography.bodyBold, color: colors.textPrimary },
  addressLine: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addForm: { marginTop: spacing.sm },
  locationButton: { marginBottom: spacing.sm },
  addAddressLink: { color: colors.primary, fontWeight: "700", marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: "center" },
});
