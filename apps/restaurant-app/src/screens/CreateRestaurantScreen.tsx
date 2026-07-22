import { apiErrorMessage, Button, colors, ImageFile, Input, spacing, typography } from "@restaurant-app/shared";
import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";
import { pickImage } from "../utils/pickImage";

export function CreateRestaurantScreen() {
  const { logout } = useAuth();
  const { refresh } = useRestaurant();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("12.9716");
  const [lng, setLng] = useState("77.5946");
  const [image, setImage] = useState<ImageFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handlePickImage() {
    const picked = await pickImage();
    if (picked) setImage(picked);
  }

  async function handleCreate() {
    setError(undefined);
    setLoading(true);
    try {
      await api.createRestaurant(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim(),
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        },
        image ?? undefined
      );
      await refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your restaurant"));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name && address && !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set up your restaurant</Text>
        <Text style={styles.subtitle}>This is what customers will see when they browse</Text>

        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>📷 Add a cover photo</Text>
          )}
        </TouchableOpacity>

        <Input label="Restaurant name" value={name} onChangeText={setName} placeholder="Tasty House" />
        <Input label="Cuisine" value={cuisine} onChangeText={setCuisine} placeholder="Indian, Chinese" />
        <Input
          label="Contact phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="For customers to reach you"
          keyboardType="phone-pad"
        />
        <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="A short description" />
        <Input label="Address" value={address} onChangeText={setAddress} placeholder="Street, area, city" />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Input label="Latitude" value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" />
          </View>
          <View style={styles.rowItem}>
            <Input label="Longitude" value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" />
          </View>
        </View>
        <Text style={styles.hint}>Tip: find your coordinates by long-pressing your location in Google Maps.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Create restaurant" onPress={handleCreate} loading={loading} disabled={!canSubmit} />
        <Button title="Log out" variant="ghost" onPress={logout} style={styles.logout} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: "center" },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  imagePicker: {
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePickerText: { color: colors.textSecondary, fontWeight: "600" },
  row: { flexDirection: "row", gap: spacing.md },
  rowItem: { flex: 1 },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: "center" },
  logout: { marginTop: spacing.sm },
});
