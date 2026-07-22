import { colors, effectivePrice, EmptyState, MenuItem, resolveImageUrl, spacing, typography } from "@restaurant-app/shared";
import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL, api } from "../api/client";
import { useRestaurant } from "../context/RestaurantContext";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"Menu">;

export function MenuScreen({ navigation }: Props) {
  const { restaurant, refresh } = useRestaurant();
  const [togglingOpen, setTogglingOpen] = useState(false);

  if (!restaurant) return null;

  async function handleToggleOpen(value: boolean) {
    setTogglingOpen(true);
    try {
      await api.updateRestaurant(restaurant!.id, { isOpen: value });
      await refresh();
    } finally {
      setTogglingOpen(false);
    }
  }

  async function handleToggleAvailability(item: MenuItem, value: boolean) {
    await api.updateMenuItem(item.id, { isAvailable: value });
    await refresh();
  }

  function handleDelete(item: MenuItem) {
    Alert.alert("Remove item", `Remove "${item.name}" from your menu?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await api.deleteMenuItem(item.id);
          await refresh();
        },
      },
    ]);
  }

  const sections = Object.entries(
    (restaurant.menuItems ?? []).reduce<Record<string, MenuItem[]>>((acc, item) => {
      acc[item.category] = acc[item.category] ?? [];
      acc[item.category].push(item);
      return acc;
    }, {})
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantMeta}>{restaurant.cuisine || "Multi-cuisine"}</Text>
          <Text style={styles.restaurantMeta}>
            {restaurant.deliveryFee > 0 ? `₹${restaurant.deliveryFee} delivery` : "Free delivery"}
            {restaurant.discountPercent > 0 ? ` · ${restaurant.discountPercent}% off orders` : ""}
          </Text>
        </View>
        <View style={styles.openToggle}>
          <Text style={styles.openLabel}>{restaurant.isOpen ? "Open" : "Closed"}</Text>
          <Switch
            value={restaurant.isOpen}
            onValueChange={handleToggleOpen}
            disabled={togglingOpen}
            trackColor={{ true: colors.success, false: colors.border }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sections.length === 0 ? (
          <EmptyState icon="🍲" title="No menu items yet" subtitle="Add your first dish to start selling" />
        ) : (
          sections.map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: resolveImageUrl(API_BASE_URL, item.imageUrl) }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Text style={{ fontSize: 20 }}>🍽️</Text>
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.discountPercent > 0 ? (
                      <View style={styles.priceRow}>
                        <Text style={styles.itemPriceStrikethrough}>₹{item.price}</Text>
                        <Text style={styles.itemPrice}>₹{effectivePrice(item)}</Text>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>{item.discountPercent}% OFF</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    <Switch
                      value={item.isAvailable}
                      onValueChange={(value) => handleToggleAvailability(item, value)}
                      trackColor={{ true: colors.success, false: colors.border }}
                    />
                    <TouchableOpacity onPress={() => navigation.navigate("MenuItemForm", { menuItemId: item.id })}>
                      <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("MenuItemForm", undefined)}>
        <Text style={styles.fabText}>+ Add item</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  restaurantName: { ...typography.h2, color: colors.textPrimary },
  restaurantMeta: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  openToggle: { alignItems: "center" },
  openLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: 4 },
  list: { padding: spacing.lg, paddingBottom: 100 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  itemImage: { width: 48, height: 48, borderRadius: 8 },
  itemImagePlaceholder: { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemName: { ...typography.bodyBold, color: colors.textPrimary },
  itemPrice: { ...typography.caption, color: colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  itemPriceStrikethrough: { ...typography.caption, color: colors.textMuted, textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: colors.successLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  discountBadgeText: { ...typography.caption, color: colors.success, fontWeight: "700", fontSize: 11 },
  itemActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  editLink: { color: colors.primary, fontWeight: "700" },
  deleteLink: { color: colors.danger, fontWeight: "700" },
  fab: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  fabText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
