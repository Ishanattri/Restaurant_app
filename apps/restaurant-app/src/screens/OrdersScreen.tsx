import { Card, colors, EmptyState, Input, Order, spacing, StatusPill, typography } from "@restaurant-app/shared";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useNotifications } from "../context/NotificationContext";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"Orders">;

export function OrdersScreen({ navigation }: Props) {
  const { clearOrdersUnread } = useNotifications();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    if (!orders) return orders;
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => {
      const haystack = [
        order.id,
        order.customer?.name,
        ...order.items.map((i) => i.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [orders, search]);

  const load = useCallback(async () => {
    setOrders(await api.restaurantOrders());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    const unsubscribe = navigation.addListener("focus", () => {
      load();
      clearOrdersUnread();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation, load, clearOrdersUnread]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Incoming orders</Text>
      <View style={styles.searchWrap}>
        <Input
          placeholder="Search by customer, order # or item"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>
      <FlatList
        data={filteredOrders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          orders !== null ? (
            <EmptyState
              icon="📭"
              title={search ? "No matching orders" : "No orders yet"}
              subtitle={search ? "Try a different search" : "New orders will show up here"}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}>
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                <StatusPill status={item.status} />
              </View>
              {item.customer?.name ? <Text style={styles.customerName}>{item.customer.name}</Text> : null}
              <Text style={styles.itemsSummary}>{item.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</Text>
              <Text style={styles.total}>
                ₹{item.total} · {item.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}
              </Text>
              {item.notes || !item.cutleryRequired ? (
                <View style={styles.badgeRow}>
                  {item.notes ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>📄 Note</Text>
                    </View>
                  ) : null}
                  {!item.cutleryRequired ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>🍴 No cutlery</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { ...typography.h2, color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  searchInput: { marginBottom: 0 },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  orderId: { ...typography.h3, color: colors.textPrimary },
  customerName: { ...typography.captionBold, color: colors.textSecondary, marginBottom: 2 },
  itemsSummary: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  total: { ...typography.bodyBold, color: colors.textPrimary },
  badgeRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  badge: { backgroundColor: colors.warningLight, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { ...typography.caption, color: colors.warning, fontWeight: "700", fontSize: 11 },
});
