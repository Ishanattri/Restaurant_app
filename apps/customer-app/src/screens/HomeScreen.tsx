import { colors, EmptyState, fontFamilyFor, resolveImageUrl, Restaurant, shadow, Skeleton, spacing, typography } from "@restaurant-app/shared";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_BASE_URL, api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { LocationPickerModal } from "../components/LocationPickerModal";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"Home">;

/** Stable pseudo delivery-time estimate derived from the restaurant id (no flicker on re-render). */
function deliveryEstimate(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  const base = 20 + (hash % 20); // 20–39 min
  return `${base}–${base + 5} min`;
}

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { selectedAddress, loading: locationLoading } = useLocationContext();
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const load = useCallback(async (query?: string) => {
    const data = await api.listRestaurants(query || undefined);
    setRestaurants(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  }

  async function handleSearchSubmit() {
    setRestaurants(null);
    await load(search);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setShowLocationPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.locationPin}>📍</Text>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationLabel}>
                {selectedAddress ? selectedAddress.label : "Set location"}
                <Text style={styles.locationCaret}>  ▾</Text>
              </Text>
              <Text style={styles.locationSub} numberOfLines={1}>
                {selectedAddress
                  ? `${selectedAddress.line1}, ${selectedAddress.city}`
                  : locationLoading
                    ? "Loading…"
                    : "Tap to choose where to deliver"}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Profile")} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "?"}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>
          Hey {user?.name?.split(" ")[0] ?? "there"} <Text>👋</Text>
        </Text>
        <Text style={styles.subtitle}>What are you craving today?</Text>

        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.search}
            placeholder="Search restaurants or cuisines"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      <LocationPickerModal visible={showLocationPicker} onClose={() => setShowLocationPicker(false)} />

      {restaurants === null ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={230} style={styles.skeletonCard} />
          ))}
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            restaurants.length > 0 ? <Text style={styles.sectionLabel}>Popular near you</Text> : null
          }
          ListEmptyComponent={
            <EmptyState icon="🔍" title="No restaurants found" subtitle="Try a different search term" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("RestaurantDetail", { restaurantId: item.id })}
              activeOpacity={0.9}
              style={styles.cardTouchable}
            >
              <View style={styles.card}>
                <View style={styles.imageWrapper}>
                  {item.imageUrl ? (
                    <Image source={{ uri: resolveImageUrl(API_BASE_URL, item.imageUrl) }} style={styles.restaurantImage} />
                  ) : (
                    <View style={[styles.restaurantImage, styles.imagePlaceholder]}>
                      <Text style={{ fontSize: 40 }}>🍽️</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={[colors.scrimTop, colors.scrimBottom]}
                    style={styles.scrim}
                    pointerEvents="none"
                  />

                  {item.discountPercent > 0 ? (
                    <View style={styles.discountRibbon}>
                      <Text style={styles.discountRibbonText}>{item.discountPercent}% OFF</Text>
                    </View>
                  ) : null}

                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>⏱ {deliveryEstimate(item.id)}</Text>
                  </View>

                  {!item.isOpen ? (
                    <View style={styles.closedOverlay}>
                      <Text style={styles.closedOverlayText}>Currently closed</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantTitleRow}>
                    <Text style={styles.restaurantName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text style={styles.restaurantCuisine} numberOfLines={1}>
                    {item.cuisine || "Multi-cuisine"}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.address}
                    </Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.metaTextStrong}>
                      {item.deliveryFee > 0 ? `₹${item.deliveryFee} delivery` : "Free delivery"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topArea: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadow.card,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  locationChip: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: spacing.md },
  locationPin: { fontSize: 20, marginRight: spacing.xs },
  locationTextWrap: { flex: 1 },
  locationLabel: { ...typography.bodyBold, color: colors.textPrimary },
  locationCaret: { color: colors.primary, fontSize: 12 },
  locationSub: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 18, ...fontFamilyFor("800") },
  greeting: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.lg },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { fontSize: 15, marginRight: spacing.sm },
  search: { flex: 1, paddingVertical: spacing.md - 2, fontSize: 15, color: colors.textPrimary },
  sectionLabel: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  skeletonCard: { borderRadius: 22, marginBottom: spacing.lg },
  cardTouchable: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    ...shadow.card,
  },
  imageWrapper: { position: "relative" },
  restaurantImage: { width: "100%", height: 168 },
  imagePlaceholder: { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 80 },
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
  discountRibbon: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    ...shadow.primary,
  },
  discountRibbonText: { color: colors.white, fontWeight: "800", fontSize: 12, letterSpacing: 0.3, ...fontFamilyFor("800") },
  timeBadge: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  timeBadgeText: { color: colors.textPrimary, fontWeight: "700", fontSize: 12, ...fontFamilyFor("700") },
  restaurantInfo: { padding: spacing.md },
  restaurantTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  restaurantName: { ...typography.h3, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { color: colors.white, fontWeight: "800", fontSize: 13, ...fontFamilyFor("800") },
  restaurantCuisine: { ...typography.body, color: colors.textSecondary, marginTop: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, gap: spacing.sm },
  metaText: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  metaTextStrong: { ...typography.captionBold, color: colors.textSecondary },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
});
