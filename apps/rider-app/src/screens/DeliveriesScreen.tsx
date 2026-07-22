import {
  apiErrorMessage,
  Button,
  Card,
  colors,
  EmptyState,
  Order,
  OrderStatus,
  Skeleton,
  spacing,
  typography,
} from "@restaurant-app/shared";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api/client";
import { useNotifications } from "../context/NotificationContext";
import { TabScreenProps } from "../navigation/types";

type Props = TabScreenProps<"Deliveries">;

const ACTIVE_STATUSES: OrderStatus[] = ["READY_FOR_PICKUP", "PICKED_UP", "ON_THE_WAY"];

export function DeliveriesScreen({ navigation }: Props) {
  const { clearDeliveriesUnread } = useNotifications();
  const [online, setOnline] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null | undefined>(undefined);
  const [available, setAvailable] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    const mine = await api.myDeliveries();
    const active = mine.find((o) => ACTIVE_STATUSES.includes(o.status) && o.riderId) ?? null;
    setActiveOrder(active);

    if (!active && online) {
      setAvailable(await api.availableDeliveries());
    }
  }, [online]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    const unsubscribe = navigation.addListener("focus", () => {
      load();
      clearDeliveriesUnread();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation, load, clearDeliveriesUnread]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleAccept(orderId: string) {
    setError(undefined);
    setAcceptingId(orderId);
    try {
      const order = await api.assignRider(orderId);
      navigation.navigate("ActiveDelivery", { orderId: order.id });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not accept this delivery — it may already be taken"));
      await load();
    } finally {
      setAcceptingId(null);
    }
  }

  if (activeOrder === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.list}>
          <Skeleton height={100} style={{ borderRadius: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (activeOrder) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={[styles.title, styles.titleStandalone]}>Deliveries</Text>
        <View style={styles.list}>
          <Card>
            <Text style={styles.activeTitle}>You have an active delivery</Text>
            <Text style={styles.activeSubtitle}>Order #{activeOrder.id.slice(-6).toUpperCase()}</Text>
            <Button
              title="Continue delivery"
              onPress={() => navigation.navigate("ActiveDelivery", { orderId: activeOrder.id })}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Deliveries</Text>
        <View style={styles.onlineToggle}>
          <Text style={styles.onlineLabel}>{online ? "Online" : "Offline"}</Text>
          <Switch value={online} onValueChange={setOnline} trackColor={{ true: colors.success, false: colors.border }} />
        </View>
      </View>

      {!online ? (
        <EmptyState icon="🌙" title="You're offline" subtitle="Go online to see available deliveries" />
      ) : (
        <FlatList
          data={available ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            available !== null ? (
              <EmptyState icon="🔍" title="No deliveries right now" subtitle="Check back in a bit" />
            ) : null
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
              <Text style={styles.pickupAddress}>Pickup: {item.restaurant?.address}</Text>
              <Text style={styles.dropAddress}>
                Drop: {item.deliveryAddress?.line1}, {item.deliveryAddress?.city}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.total}>
                  ₹{item.total} · {item.paymentMethod === "COD" ? "COD" : "Paid online"}
                </Text>
                <Button
                  title="Accept"
                  onPress={() => handleAccept(item.id)}
                  loading={acceptingId === item.id}
                  disabled={acceptingId !== null}
                  style={styles.acceptButton}
                />
              </View>
            </Card>
          )}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  titleStandalone: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  onlineToggle: { alignItems: "center" },
  onlineLabel: { ...typography.captionBold, color: colors.textSecondary, marginBottom: 4 },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  restaurantName: { ...typography.h3, color: colors.textPrimary },
  pickupAddress: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  dropAddress: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  total: { ...typography.bodyBold, color: colors.textPrimary },
  acceptButton: { paddingHorizontal: spacing.lg },
  activeTitle: { ...typography.h3, color: colors.textPrimary },
  activeSubtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  error: { color: colors.danger, textAlign: "center", padding: spacing.md },
});
