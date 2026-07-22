import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  apiErrorMessage,
  Button,
  colors,
  effectivePrice,
  Header,
  ImageFile,
  Input,
  resolveImageUrl,
  spacing,
  typography,
} from "@restaurant-app/shared";
import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL, api } from "../api/client";
import { useRestaurant } from "../context/RestaurantContext";
import { AppStackParamList } from "../navigation/types";
import { pickImage } from "../utils/pickImage";

type Props = NativeStackScreenProps<AppStackParamList, "MenuItemForm">;

export function MenuItemFormScreen({ route, navigation }: Props) {
  const { restaurant, refresh } = useRestaurant();
  const menuItemId = route.params?.menuItemId;
  const existing = restaurant?.menuItems?.find((m) => m.id === menuItemId);
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [isVeg, setIsVeg] = useState(existing?.isVeg ?? true);
  const [discountPercent, setDiscountPercent] = useState(existing ? String(existing.discountPercent) : "0");
  const [image, setImage] = useState<ImageFile | null>(null);
  const [existingImageUrl] = useState(existing?.imageUrl ?? null);
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
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        category: category.trim(),
        isVeg,
        discountPercent: parseFloat(discountPercent) || 0,
      };
      if (isEditing && existing) {
        await api.updateMenuItem(existing.id, data, image ?? undefined);
      } else {
        await api.createMenuItem(restaurant.id, data, image ?? undefined);
      }
      await refresh();
      navigation.goBack();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save this item"));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name && category && !Number.isNaN(parseFloat(price)) && parseFloat(price) > 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title={isEditing ? "Edit item" : "Add item"} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {image || existingImageUrl ? (
            <Image
              source={{ uri: image?.uri ?? resolveImageUrl(API_BASE_URL, existingImageUrl) }}
              style={styles.imagePreview}
            />
          ) : (
            <Text style={styles.imagePickerText}>📷 Add a photo</Text>
          )}
        </TouchableOpacity>

        <Input label="Name" value={name} onChangeText={setName} placeholder="Paneer Butter Masala" />
        <Input label="Category" value={category} onChangeText={setCategory} placeholder="Main Course" />
        <Input label="Price (₹)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="220" />
        <Input
          label="Discount (%, optional)"
          value={discountPercent}
          onChangeText={setDiscountPercent}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        {parseFloat(discountPercent) > 0 && parseFloat(price) > 0 && !Number.isNaN(parseFloat(price)) ? (
          <Text style={styles.discountPreview}>
            Customers will see: <Text style={styles.strikethrough}>₹{price}</Text>{" "}
            ₹{effectivePrice({ price: parseFloat(price), discountPercent: parseFloat(discountPercent) })}
          </Text>
        ) : null}
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Short description"
        />

        <View style={styles.vegRow}>
          <Text style={styles.vegLabel}>Vegetarian</Text>
          <Switch value={isVeg} onValueChange={setIsVeg} trackColor={{ true: colors.success, false: colors.border }} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={isEditing ? "Save changes" : "Add to menu"} onPress={handleSave} loading={loading} disabled={!canSubmit} />
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
  vegRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  vegLabel: { ...typography.bodyBold, color: colors.textPrimary },
  discountPreview: {
    ...typography.caption,
    color: colors.success,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  strikethrough: { textDecorationLine: "line-through", color: colors.textMuted },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: "center" },
});
