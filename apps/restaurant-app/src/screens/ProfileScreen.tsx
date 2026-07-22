import { Button, Card, colors, spacing, typography } from "@restaurant-app/shared";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { restaurant } = useRestaurant();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "?"}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {restaurant ? (
        <Card style={styles.card}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantMeta}>{restaurant.cuisine || "Multi-cuisine"}</Text>
          <Text style={styles.restaurantMeta}>{restaurant.address}</Text>
          <Text style={styles.restaurantMeta}>★ {restaurant.rating.toFixed(1)}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("EditRestaurant")}>
            <Text style={styles.editLink}>Edit restaurant details</Text>
          </TouchableOpacity>
        </Card>
      ) : null}

      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => navigation.navigate("Earnings")}
        activeOpacity={0.7}
      >
        <Text style={styles.menuIcon}>💰</Text>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuLabel}>Earnings</Text>
          <Text style={styles.menuSubtitle}>See how much you've earned, and export to Excel</Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate("Feedback")} activeOpacity={0.7}>
        <Text style={styles.menuIcon}>💬</Text>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuLabel}>Customer Feedback</Text>
          <Text style={styles.menuSubtitle}>See what customers are saying, and who said it</Text>
        </View>
        <Text style={styles.menuChevron}>›</Text>
      </TouchableOpacity>

      <Button title="Log out" variant="outline" onPress={logout} style={styles.logoutButton} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  avatarText: { color: colors.white, fontWeight: "700", fontSize: 28 },
  name: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.md },
  email: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  card: { width: "100%", marginTop: spacing.xl },
  restaurantName: { ...typography.h3, color: colors.textPrimary },
  restaurantMeta: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  editLink: { ...typography.bodyBold, color: colors.primary, marginTop: spacing.md },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  menuIcon: { fontSize: 22, marginRight: spacing.md },
  menuTextWrap: { flex: 1 },
  menuLabel: { ...typography.bodyBold, color: colors.textPrimary },
  menuSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  menuChevron: { color: colors.textMuted, fontSize: 20 },
  logoutButton: { width: "100%", marginTop: spacing.xl },
});
