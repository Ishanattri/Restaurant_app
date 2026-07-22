import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Card,
  colors,
  EmptyState,
  effectivePrice,
  Header,
  MenuItem,
  resolveImageUrl,
  Restaurant,
  fontFamilyFor,
  shadow,
  spacing,
  typography,
} from "@restaurant-app/shared";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL, api } from "../api/client";
import { useCart } from "../context/CartContext";
import { AppStackParamList } from "../navigation/types";

/** Zomato/Swiggy-style Veg-mode control: veg symbol + label + animated switch. */
function VegModeToggle({ value, onToggle }: { value: boolean; onToggle: (next: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value, anim]);

  const knobTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 21] });
  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.success],
  });

  return (
    <TouchableOpacity
      style={[vegToggleStyles.container, value && vegToggleStyles.containerActive]}
      onPress={() => onToggle(!value)}
      activeOpacity={0.85}
    >
      <View style={[vegToggleStyles.vegMark, value ? vegToggleStyles.vegMarkVeg : vegToggleStyles.vegMarkMuted]}>
        <View style={[vegToggleStyles.vegDot, value ? vegToggleStyles.vegDotVeg : vegToggleStyles.vegDotMuted]} />
      </View>
      <Text style={[vegToggleStyles.label, value && vegToggleStyles.labelActive]}>Veg Mode</Text>
      <Animated.View style={[vegToggleStyles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[vegToggleStyles.knob, { transform: [{ translateX: knobTranslate }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const vegToggleStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingLeft: spacing.sm + 2,
    paddingRight: 4,
    paddingVertical: 4,
  },
  containerActive: { borderColor: colors.success, backgroundColor: colors.successLight },
  vegMark: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  vegMarkVeg: { borderColor: colors.success },
  vegMarkMuted: { borderColor: colors.textMuted },
  vegDot: { width: 7, height: 7, borderRadius: 4 },
  vegDotVeg: { backgroundColor: colors.success },
  vegDotMuted: { backgroundColor: colors.textMuted },
  label: { ...typography.captionBold, color: colors.textSecondary },
  labelActive: { color: colors.success },
  track: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
});

type Props = NativeStackScreenProps<AppStackParamList, "RestaurantDetail">;

type MenuSection = { title: string; data: MenuItem[] };

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const { lines, itemCount, subtotal, addItem, decrementItem } = useCart();
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const listRef = useRef<SectionList<MenuItem, MenuSection>>(null);
  const pendingScroll = useRef<number | null>(null);

  useEffect(() => {
    api.getRestaurant(restaurantId).then(setRestaurant);
  }, [restaurantId]);

  if (!restaurant) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const query = search.trim().toLowerCase();
  const filteredItems = (restaurant.menuItems ?? []).filter((item) => {
    if (vegOnly && !item.isVeg) return false;
    if (query && !item.name.toLowerCase().includes(query)) return false;
    return true;
  });

  const sections: MenuSection[] = Object.entries(
    filteredItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
      acc[item.category] = acc[item.category] ?? [];
      acc[item.category].push(item);
      return acc;
    }, {})
  ).map(([title, data]) => ({ title, data }));

  const categories = sections.map((s) => s.title);

  function quantityFor(menuItemId: string) {
    return lines.find((l) => l.menuItem.id === menuItemId)?.quantity ?? 0;
  }

  function scrollToCategory(sectionIndex: number) {
    setCategoryMenuOpen(false);
    pendingScroll.current = sectionIndex;
    // Defer so the menu-close render settles before we scroll.
    requestAnimationFrame(() => {
      listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, viewOffset: 12, animated: true });
    });
  }

  return (
    <View style={styles.container}>
      <Header title={restaurant.name} onBack={() => navigation.goBack()} />

      <View style={styles.toolbar}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for dishes"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        <VegModeToggle value={vegOnly} onToggle={setVegOnly} />
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        stickySectionHeadersEnabled={false}
        onScrollToIndexFailed={() => {
          const target = pendingScroll.current;
          if (target == null) return;
          setTimeout(() => {
            listRef.current?.scrollToLocation({ sectionIndex: target, itemIndex: 0, viewOffset: 12, animated: true });
          }, 250);
        }}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="No dishes found"
            subtitle={vegOnly ? "Try turning off Veg mode or a different search" : "Try a different search term"}
          />
        }
        ListHeaderComponent={
          <View style={styles.info}>
            {restaurant.imageUrl ? (
              <View style={styles.bannerWrap}>
                <Image source={{ uri: resolveImageUrl(API_BASE_URL, restaurant.imageUrl) }} style={styles.banner} />
                <LinearGradient colors={[colors.scrimTop, colors.scrimBottom]} style={styles.bannerScrim} pointerEvents="none" />
                <View style={styles.bannerRating}>
                  <Text style={styles.bannerRatingText}>★ {restaurant.rating.toFixed(1)}</Text>
                </View>
                {!restaurant.isOpen ? (
                  <View style={styles.closedOverlay}>
                    <Text style={styles.closedOverlayText}>Currently closed</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.cuisine}>{restaurant.cuisine || "Multi-cuisine"}</Text>
            <Text style={styles.address}>📍 {restaurant.address}</Text>

            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>⏱ 25–30 min</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {restaurant.deliveryFee > 0 ? `₹${restaurant.deliveryFee} delivery` : "Free delivery"}
                </Text>
              </View>
            </View>

            {restaurant.discountPercent > 0 ? (
              <View style={styles.restaurantDiscountBadge}>
                <Text style={styles.restaurantDiscountText}>🎉 {restaurant.discountPercent}% OFF on this order</Text>
              </View>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrapper}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const qty = quantityFor(item.id);
          return (
            <Card style={styles.itemCard}>
              <View style={styles.itemRow}>
                {item.imageUrl ? (
                  <Image source={{ uri: resolveImageUrl(API_BASE_URL, item.imageUrl) }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Text style={{ fontSize: 20 }}>🍽️</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.success : colors.danger }]} />
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  {item.description ? (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
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
                {!item.isAvailable ? (
                  <Text style={styles.unavailable}>Unavailable</Text>
                ) : qty === 0 ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addItem(restaurant, item)}
                    disabled={!restaurant.isOpen}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addButtonText}>ADD</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepperButton} onPress={() => decrementItem(item.id)}>
                      <Text style={styles.stepperText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{qty}</Text>
                    <TouchableOpacity style={styles.stepperButton} onPress={() => addItem(restaurant, item)}>
                      <Text style={styles.stepperText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          );
        }}
      />
      {/* Floating menu-category dropdown (bottom-right), lifted above the cart bar when present */}
      {categories.length > 0 ? (
        <>
          {categoryMenuOpen ? (
            <Pressable style={styles.backdrop} onPress={() => setCategoryMenuOpen(false)} />
          ) : null}

          {categoryMenuOpen ? (
            <View style={[styles.dropdown, { bottom: (itemCount > 0 ? spacing.lg + 60 : spacing.lg) + 52 }]}>
              <Text style={styles.dropdownTitle}>Jump to category</Text>
              <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                {categories.map((title, index) => (
                  <TouchableOpacity
                    key={title}
                    style={styles.dropdownRow}
                    onPress={() => scrollToCategory(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownRowText}>{title}</Text>
                    <Text style={styles.dropdownCount}>{sections[index].data.length}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.fab, { bottom: itemCount > 0 ? spacing.lg + 60 : spacing.lg }]}
            onPress={() => setCategoryMenuOpen((open) => !open)}
            activeOpacity={0.85}
          >
            <Text style={styles.fabIcon}>{categoryMenuOpen ? "✕" : "☰"}</Text>
            <Text style={styles.fabText}>Menu</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {itemCount > 0 ? (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate("Cart")}>
          <Text style={styles.cartBarText}>
            {itemCount} item{itemCount > 1 ? "s" : ""} · ₹{subtotal}
          </Text>
          <Text style={styles.cartBarAction}>View cart →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { fontSize: 15, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.sm + 4, fontSize: 15, color: colors.textPrimary },
  list: { backgroundColor: colors.surface },
  listContent: { paddingBottom: 100 },
  info: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.background },
  bannerWrap: { borderRadius: 20, overflow: "hidden", marginBottom: spacing.md, ...shadow.card },
  banner: { width: "100%", height: 175 },
  bannerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 90 },
  bannerRating: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  bannerRatingText: { color: colors.white, fontWeight: "800", fontSize: 13, ...fontFamilyFor("800") },
  closedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(21,21,26,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  closedOverlayText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  cuisine: { ...typography.h2, color: colors.textPrimary },
  address: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.captionBold, color: colors.textSecondary },
  restaurantDiscountBadge: {
    backgroundColor: colors.successLight,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  restaurantDiscountText: { ...typography.captionBold, color: colors.success },
  sectionHeaderWrapper: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  itemCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: spacing.sm },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemImage: { width: 72, height: 72, borderRadius: 14, marginRight: spacing.md },
  itemImagePlaceholder: { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1, marginRight: spacing.md },
  itemNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  vegDot: { width: 12, height: 12, borderRadius: 3 },
  itemName: { ...typography.bodyBold, color: colors.textPrimary },
  itemDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  itemPrice: { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs },
  priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs, flexWrap: "wrap" },
  itemPriceStrikethrough: { ...typography.caption, color: colors.textMuted, textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: colors.successLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  discountBadgeText: { ...typography.caption, color: colors.success, fontWeight: "700", fontSize: 11, ...fontFamilyFor("700") },
  unavailable: { ...typography.caption, color: colors.textMuted },
  addButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addButtonText: { color: colors.primary, fontWeight: "800", letterSpacing: 0.3, ...fontFamilyFor("800") },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  stepperButton: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.sm },
  stepperText: { color: colors.white, fontWeight: "700", fontSize: 16, ...fontFamilyFor("700") },
  stepperQty: { color: colors.white, fontWeight: "800", minWidth: 20, textAlign: "center", ...fontFamilyFor("800") },
  cartBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...shadow.primary,
  },
  cartBarText: { color: colors.white, fontWeight: "800", fontSize: 15, ...fontFamilyFor("800") },
  cartBarAction: { color: colors.white, fontWeight: "800", fontSize: 15, ...fontFamilyFor("800") },
  fab: {
    position: "absolute",
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 999,
    ...shadow.floating,
  },
  fabIcon: { color: colors.white, fontSize: 15, fontWeight: "800" },
  fabText: { color: colors.white, fontWeight: "800", fontSize: 14, ...fontFamilyFor("800") },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  dropdown: {
    position: "absolute",
    right: spacing.lg,
    width: 230,
    maxHeight: 320,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: spacing.sm,
    ...shadow.floating,
  },
  dropdownTitle: {
    ...typography.captionBold,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dropdownScroll: { flexGrow: 0 },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  dropdownRowText: { ...typography.body, color: colors.textPrimary },
  dropdownCount: { ...typography.captionBold, color: colors.textMuted },
});
