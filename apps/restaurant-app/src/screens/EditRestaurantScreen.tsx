import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  apiErrorMessage,
  Button,
  colors,
  Header,
  ImageFile,
  Input,
  resolveImageUrl,
  spacing,
  typography,
} from "@restaurant-app/shared";
import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL, api } from "../api/client";
import { useRestaurant } from "../context/RestaurantContext";
import { AppStackParamList } from "../navigation/types";
import { pickImage } from "../utils/pickImage";

type Props = NativeStackScreenProps<AppStackParamList, "EditRestaurant">;

export function EditRestaurantScreen({ navigation }: Props) {
  const { restaurant, refresh } = useRestaurant();
  const [name, setName] = useState(restaurant?.name ?? "");
  const [description, setDescription] = useState(restaurant?.description ?? "");
  const [cuisine, setCuisine] = useState(restaurant?.cuisine ?? "");
  const [phone, setPhone] = useState(restaurant?.phone ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [lat, setLat] = useState(restaurant ? String(restaurant.lat) : "");
  const [lng, setLng] = useState(restaurant ? String(restaurant.lng) : "");
  const [deliveryFee, setDeliveryFee] = useState(restaurant ? String(restaurant.deliveryFee) : "25");
  const [discountPercent, setDiscountPercent] = useState(restaurant ? String(restaurant.discountPercent) : "0");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(restaurant ? String(restaurant.serviceRadiusKm) : "7");
  const [image, setImage] = useState<ImageFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handlePickImage() {
    const picked = await pickImage();
    if (picked) setImage(picked);
  }

  async function handleSave() {
    if (!restaurant) return;
    setError(undefined);
    setLoading(true);
    try {
      await api.updateRestaurant(
        restaurant.id,
        {
          name: name.trim(),
          description: description.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim(),
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          deliveryFee: parseFloat(deliveryFee) || 0,
          discountPercent: parseFloat(discountPercent) || 0,
          serviceRadiusKm: parseFloat(serviceRadiusKm) || 0,
        },
        image ?? undefined
      );
      await refresh();
      navigation.goBack();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save changes"));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name && address && !Number.isNaN(parseFloat(lat)) && !Number.isNaN(parseFloat(lng));

  if (!restaurant) return null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="Edit restaurant" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {image || restaurant.imageUrl ? (
            <Image
              source={{ uri: image?.uri ?? resolveImageUrl(API_BASE_URL, restaurant.imageUrl) }}
              style={styles.imagePreview}
            />
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
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="A short description"
        />
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

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Input
              label="Delivery fee (₹)"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              keyboardType="decimal-pad"
              placeholder="25"
            />
          </View>
          <View style={styles.rowItem}>
            <Input
              label="Order discount (%)"
              value={discountPercent}
              onChangeText={setDiscountPercent}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
        </View>
        <Text style={styles.hint}>
          Set delivery fee to 0 for free delivery. Order discount applies automatically to every order from this
          restaurant.
        </Text>

        <Input
          label="Delivery area radius (km)"
          value={serviceRadiusKm}
          onChangeText={setServiceRadiusKm}
          keyboardType="decimal-pad"
          placeholder="7"
        />
        <Text style={styles.hint}>Customers outside this radius won't be able to order from you.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Save changes" onPress={handleSave} loading={loading} disabled={!canSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
});
