import { Card, colors, EmptyState, Order, resolveImageUrl, spacing, StatusPill, typography } from "@restaurant-app/shared";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL, api } from "../api/client";
import { useNotifications } from "../context/NotificationContext";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"Orders">;

export function OrdersScreen({ navigation }: Props) {
  const { clearOrdersUnread } = useNotifications();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setOrders(await api.myOrders());
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      load();
      clearOrdersUnread();
    });
    return unsubscribe;
  }, [navigation, load, clearOrdersUnread]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Your orders</Text>
      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          orders !== null ? (
            <EmptyState icon="📦" title="No orders yet" subtitle="Your placed orders will show up here" />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })} activeOpacity={0.85}>
            <Card style={styles.card}>
              <View style={styles.row}>
                {item.restaurant?.imageUrl ? (
                  <Image
                    source={{ uri: resolveImageUrl(API_BASE_URL, item.restaurant.imageUrl) }}
                    style={styles.thumbnail}
                  />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Text style={{ fontSize: 18 }}>🍽️</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text style={styles.restaurantName} numberOfLines={1}>
                      {item.restaurant?.name ?? "Restaurant"}
                    </Text>
                    <StatusPill status={item.status} />
                  </View>
                  <Text style={styles.itemsSummary} numberOfLines={1}>
                    {item.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </Text>
                  <View style={styles.footerRow}>
                    <Text style={styles.total}>₹{item.total}</Text>
                    <Text style={styles.date}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                </View>
              </View>
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
  list: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.md },
  thumbnail: { width: 56, height: 56, borderRadius: 12 },
  thumbnailPlaceholder: { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2, gap: spacing.sm },
  restaurantName: { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  itemsSummary: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { ...typography.bodyBold, color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textMuted },
});
