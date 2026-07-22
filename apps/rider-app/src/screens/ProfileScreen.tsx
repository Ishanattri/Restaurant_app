import { Button, colors, spacing, typography } from "@restaurant-app/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? "?"}</Text>
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <Button title="Log out" variant="outline" onPress={logout} style={styles.logoutButton} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", padding: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  avatarText: { color: colors.white, fontWeight: "700", fontSize: 28 },
  name: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.md },
  email: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  logoutButton: { width: "100%", marginTop: spacing.xl },
});
