import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card, colors, EmptyState, Header, Restaurant, spacing, typography } from "@restaurant-app/shared";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "ContactRestaurant">;

export function ContactRestaurantScreen({ navigation }: Props) {
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);

  useEffect(() => {
    api.myOrders().then((orders) => {
      const byId = new Map<string, Restaurant>();
      orders.forEach((o) => {
        if (o.restaurant) byId.set(o.restaurant.id, o.restaurant);
      });
      setRestaurants(Array.from(byId.values()));
    });
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Contact Restaurant" onBack={() => navigation.goBack()} />
      {restaurants === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : restaurants.length === 0 ? (
        <EmptyState icon="📞" title="No restaurants yet" subtitle="Order from a restaurant to contact them here" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {restaurants.map((r) => (
            <Card key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.name}</Text>
              <Text style={styles.address}>📍 {r.address}</Text>
              {r.phone ? (
                <TouchableOpacity style={styles.callRow} onPress={() => Linking.openURL(`tel:${r.phone}`)}>
                  <Text style={styles.callText}>📞 Call {r.phone}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noPhone}>No contact number on file for this restaurant</Text>
              )}
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  name: { ...typography.h3, color: colors.textPrimary },
  address: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  callRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  callText: { ...typography.bodyBold, color: colors.primary },
  noPhone: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
