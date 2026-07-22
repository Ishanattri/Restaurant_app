import { Card, colors, EmptyState, Order, spacing, StatusPill, typography } from "@restaurant-app/shared";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"History">;

export function HistoryScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const mine = await api.myDeliveries();
    setOrders(mine.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED"));
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation, load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Delivery history</Text>
      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          orders !== null ? <EmptyState icon="🗂️" title="No deliveries yet" subtitle="Completed deliveries show up here" /> : null
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.address}>
              {item.deliveryAddress?.line1}, {item.deliveryAddress?.city}
            </Text>
            <Text style={styles.total}>₹{item.total} · COD</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { ...typography.h2, color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  restaurantName: { ...typography.h3, color: colors.textPrimary },
  address: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  total: { ...typography.bodyBold, color: colors.textPrimary },
});
