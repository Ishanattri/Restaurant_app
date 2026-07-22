import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiErrorMessage, Button, Card, colors, Header, Order, OrderStatus, spacing, StatusPill, typography } from "@restaurant-app/shared";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "OrderDetail">;

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  PLACED: { label: "Accept order", next: "ACCEPTED" },
  ACCEPTED: { label: "Start preparing", next: "PREPARING" },
  PREPARING: { label: "Mark ready for pickup", next: "READY_FOR_PICKUP" },
};

const CANCELLABLE: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING"];

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const load = useCallback(async () => {
    setOrder(await api.getOrder(orderId));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdateStatus(status: OrderStatus) {
    setError(undefined);
    setUpdating(true);
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrder(updated);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update this order"));
    } finally {
      setUpdating(false);
    }
  }

  if (!order) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const action = NEXT_ACTION[order.status];
  const canCancel = CANCELLABLE.includes(order.status);

  return (
    <View style={styles.container}>
      <Header title={`Order #${order.id.slice(-6).toUpperCase()}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Status</Text>
            <StatusPill status={order.status} />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Items</Text>
        <Card>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.quantity}× {item.name}
              </Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={[styles.itemRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              Total ({order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"})
            </Text>
            <Text style={styles.totalLabel}>₹{order.total}</Text>
          </View>
        </Card>

        {order.notes || !order.cutleryRequired ? (
          <>
            <Text style={styles.sectionTitle}>Special instructions</Text>
            <Card>
              {order.notes ? <Text style={styles.noteText}>📄 "{order.notes}"</Text> : null}
              {!order.cutleryRequired ? (
                <Text style={[styles.noteText, order.notes ? styles.noteSpacing : undefined]}>
                  🍴 Customer does not need cutlery
                </Text>
              ) : null}
            </Card>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Customer</Text>
        <Card>
          <Text style={styles.addressLabel}>{order.customer?.name ?? "Unknown customer"}</Text>
          {order.customer?.phone ? (
            <TouchableOpacity style={styles.callRow} onPress={() => Linking.openURL(`tel:${order.customer!.phone}`)}>
              <Text style={styles.callText}>📞 {order.customer.phone}</Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        {order.deliveryAddress ? (
          <>
            <Text style={styles.sectionTitle}>Deliver to</Text>
            <Card>
              <Text style={styles.addressLabel}>{order.deliveryAddress.label}</Text>
              <Text style={styles.addressLine}>
                {order.deliveryAddress.line1}, {order.deliveryAddress.city}
              </Text>
              {order.deliveryAddress.phone ? (
                <TouchableOpacity
                  style={styles.callRow}
                  onPress={() => Linking.openURL(`tel:${order.deliveryAddress!.phone}`)}
                >
                  <Text style={styles.callText}>📞 Call customer · {order.deliveryAddress.phone}</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          </>
        ) : null}

        {order.status === "READY_FOR_PICKUP" && !order.riderId ? (
          <Text style={styles.waitingNote}>Waiting for a rider to accept this delivery…</Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {action ? (
          <Button title={action.label} onPress={() => handleUpdateStatus(action.next)} loading={updating} style={styles.actionButton} />
        ) : null}
        {canCancel ? (
          <Button
            title="Cancel order"
            variant="outline"
            onPress={() => handleUpdateStatus("CANCELLED")}
            loading={updating}
            style={styles.actionButton}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  itemName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  itemPrice: { ...typography.body, color: colors.textPrimary },
  totalRow: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  totalLabel: { ...typography.bodyBold, color: colors.textPrimary },
  addressLabel: { ...typography.bodyBold, color: colors.textPrimary },
  addressLine: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  callRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  callText: { ...typography.bodyBold, color: colors.primary },
  noteText: { ...typography.body, color: colors.textPrimary },
  noteSpacing: { marginTop: spacing.sm },
  waitingNote: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  error: { color: colors.danger, textAlign: "center" },
  actionButton: { marginTop: spacing.xs },
});
