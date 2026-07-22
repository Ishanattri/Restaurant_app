import { Address, apiErrorMessage, Button, Card, colors, spacing, typography } from "@restaurant-app/shared";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.listAddresses().then(setAddresses);
  }, []);

  async function handleDeleteAddress(id: string) {
    setDeletingId(id);
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      Alert.alert("Can't remove this address", apiErrorMessage(err, "Something went wrong"));
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDeleteAddress(addr: Address) {
    Alert.alert("Remove address", `Remove "${addr.label}" from your saved addresses?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => handleDeleteAddress(addr.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.screenTitle}>Profile</Text>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "?"}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Text style={styles.sectionTitle}>Saved addresses</Text>
        {addresses.map((addr) => (
          <Card key={addr.id} style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                <Text style={styles.addressLine}>
                  {addr.line1}, {addr.city}
                </Text>
              </View>
              <TouchableOpacity onPress={() => confirmDeleteAddress(addr)} disabled={deletingId === addr.id}>
                <Text style={styles.removeLink}>{deletingId === addr.id ? "Removing…" : "Remove"}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
        {addresses.length === 0 ? <Text style={styles.emptyAddresses}>No saved addresses yet</Text> : null}

        <Text style={styles.sectionTitle}>Restaurants</Text>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("SendFeedback")}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>💬</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Send Feedback</Text>
            <Text style={styles.menuSubtitle}>Tell a restaurant what you thought</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate("ContactRestaurant")}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📞</Text>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Contact Restaurant</Text>
            <Text style={styles.menuSubtitle}>Reach a restaurant you've ordered from</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

        <Button title="Log out" variant="outline" onPress={logout} style={styles.logoutButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenTitle: { ...typography.h2, color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
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
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    alignSelf: "flex-start",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  addressCard: { width: "100%", marginBottom: spacing.sm },
  addressRow: { flexDirection: "row", alignItems: "center" },
  addressLabel: { ...typography.bodyBold, color: colors.textPrimary },
  addressLine: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  removeLink: { color: colors.danger, fontWeight: "600" },
  emptyAddresses: { ...typography.body, color: colors.textMuted, alignSelf: "flex-start" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  menuIcon: { fontSize: 22, marginRight: spacing.md },
  menuTextWrap: { flex: 1 },
  menuLabel: { ...typography.bodyBold, color: colors.textPrimary },
  menuSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  menuChevron: { color: colors.textMuted, fontSize: 20 },
  logoutButton: { width: "100%", marginTop: spacing.xl },
});
