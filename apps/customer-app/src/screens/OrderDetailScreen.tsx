import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  apiErrorMessage,
  Button,
  Card,
  colors,
  createOrderSocket,
  Header,
  joinOrderRoom,
  leaveOrderRoom,
  Order,
  OrderStatus,
  RiderLocationPayload,
  spacing,
  StatusPill,
  typography,
} from "@restaurant-app/shared";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL, api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { LiveTrackingMap } from "../components/LiveTrackingMap";
import { AppStackParamList } from "../navigation/types";
import { RazorpayCheckout, RazorpaySuccess } from "../components/RazorpayCheckout";

type Props = NativeStackScreenProps<AppStackParamList, "OrderDetail">;

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PLACED", label: "Order placed" },
  { status: "ACCEPTED", label: "Accepted by restaurant" },
  { status: "PREPARING", label: "Preparing your food" },
  { status: "READY_FOR_PICKUP", label: "Ready for pickup" },
  { status: "PICKED_UP", label: "Rider picked up order" },
  { status: "ON_THE_WAY", label: "On the way" },
  { status: "DELIVERED", label: "Delivered" },
];

const ACTIVE_STATUSES: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "ON_THE_WAY"];

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { token, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [riderLocation, setRiderLocation] = useState<RiderLocationPayload | null>(null);
  const [payingNow, setPayingNow] = useState(false);
  const [paymentError, setPaymentError] = useState<string | undefined>();

  const load = useCallback(async () => {
    setOrder(await api.getOrder(orderId));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while the order is active so the timeline stays current even if the socket drops.
  useEffect(() => {
    if (!order || !ACTIVE_STATUSES.includes(order.status)) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [order, load]);

  // Join the order's room for live status changes and rider GPS updates.
  useEffect(() => {
    if (!token || !order || !ACTIVE_STATUSES.includes(order.status)) return;

    const socket = createOrderSocket(API_BASE_URL, token);
    joinOrderRoom(socket, orderId);
    socket.on("rider:location", (payload: RiderLocationPayload) => {
      if (payload.orderId === orderId) setRiderLocation(payload);
    });
    socket.on("order:status", () => {
      load();
    });

    return () => {
      leaveOrderRoom(socket, orderId);
      socket.disconnect();
    };
  }, [token, order?.status, orderId, load]);

  if (!order) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";
  const needsPayment = order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID" && !isCancelled;

  async function handlePaymentSuccess(result: RazorpaySuccess) {
    try {
      const updated = await api.verifyPayment(order!.id, result);
      setOrder(updated);
    } catch (err) {
      setPaymentError(apiErrorMessage(err, "Payment could not be verified"));
    } finally {
      setPayingNow(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Order details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {order.riderId && order.restaurant && order.deliveryAddress ? (
          <LiveTrackingMap
            restaurant={order.restaurant}
            deliveryAddress={order.deliveryAddress}
            riderLocation={riderLocation}
          />
        ) : null}

        <Card>
          <View style={styles.row}>
            <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
            <StatusPill status={order.status} />
          </View>
          {order.restaurant?.phone ? (
            <TouchableOpacity
              style={styles.callRestaurantRow}
              onPress={() => Linking.openURL(`tel:${order.restaurant!.phone}`)}
            >
              <Text style={styles.callRestaurantText}>📞 Call restaurant · {order.restaurant.phone}</Text>
            </TouchableOpacity>
          ) : null}

          {isCancelled ? (
            <Text style={styles.cancelledNote}>This order was cancelled.</Text>
          ) : (
            <View style={styles.timeline}>
              {TIMELINE_STEPS.map((step, index) => {
                const isDone = index <= currentIndex;
                return (
                  <View key={step.status} style={styles.timelineRow}>
                    <View style={[styles.timelineDot, isDone && styles.timelineDotDone]} />
                    <Text style={[styles.timelineLabel, isDone && styles.timelineLabelDone]}>{step.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {order.riderId && order.rider ? (
          <>
            <Text style={styles.sectionTitle}>Your rider</Text>
            <Card>
              <Text style={styles.addressLabel}>{order.rider.user?.name ?? "Rider assigned"}</Text>
              {order.rider.user?.phone ? (
                <TouchableOpacity
                  style={styles.callRiderRow}
                  onPress={() => Linking.openURL(`tel:${order.rider!.user!.phone}`)}
                >
                  <Text style={styles.callRiderText}>📞 Call rider · {order.rider.user.phone}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noPhoneText}>No contact number on file for this rider</Text>
              )}
            </Card>
          </>
        ) : null}

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
          <View style={[styles.itemRow, styles.subtotalRow]}>
            <Text style={styles.itemPrice}>Subtotal</Text>
            <Text style={styles.itemPrice}>₹{order.subtotal}</Text>
          </View>
          {order.discountAmount > 0 ? (
            <View style={styles.itemRow}>
              <Text style={styles.discountText}>Discount</Text>
              <Text style={styles.discountText}>−₹{order.discountAmount}</Text>
            </View>
          ) : null}
          <View style={styles.itemRow}>
            <Text style={styles.itemPrice}>Delivery fee</Text>
            <Text style={styles.itemPrice}>{order.deliveryFee > 0 ? `₹${order.deliveryFee}` : "Free"}</Text>
          </View>
          <View style={[styles.itemRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              Total ({order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentStatus === "PAID" ? "Paid online" : "Payment pending"})
            </Text>
            <Text style={styles.totalLabel}>₹{order.total}</Text>
          </View>
        </Card>

        {needsPayment ? (
          <Card>
            <Text style={styles.paymentPendingTitle}>Payment not completed</Text>
            <Text style={styles.paymentPendingSubtitle}>
              The restaurant won't start preparing your order until payment is confirmed.
            </Text>
            <Button
              title="Complete payment"
              onPress={() => setPayingNow(true)}
              style={{ marginTop: spacing.md }}
            />
            {paymentError ? <Text style={styles.error}>{paymentError}</Text> : null}
          </Card>
        ) : null}

        {order.deliveryAddress ? (
          <>
            <Text style={styles.sectionTitle}>Delivering to</Text>
            <Card>
              <Text style={styles.addressLabel}>{order.deliveryAddress.label}</Text>
              <Text style={styles.addressLine}>
                {order.deliveryAddress.line1}, {order.deliveryAddress.city}
              </Text>
            </Card>
          </>
        ) : null}
      </ScrollView>

      {payingNow && order.razorpayKeyId && order.razorpayOrderId ? (
        <RazorpayCheckout
          visible
          keyId={order.razorpayKeyId}
          orderId={order.razorpayOrderId}
          amount={order.total}
          name={user?.name ?? "Customer"}
          email={user?.email}
          contact={user?.phone ?? undefined}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPayingNow(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  restaurantName: { ...typography.h3, color: colors.textPrimary },
  callRestaurantRow: { marginTop: -spacing.sm, marginBottom: spacing.md },
  callRestaurantText: { ...typography.bodyBold, color: colors.primary },
  cancelledNote: { ...typography.body, color: colors.danger },
  timeline: { gap: spacing.md },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  timelineDotDone: { backgroundColor: colors.success },
  timelineLabel: { ...typography.body, color: colors.textMuted },
  timelineLabelDone: { color: colors.textPrimary, fontWeight: "600" },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.sm },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  itemName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  itemPrice: { ...typography.body, color: colors.textPrimary },
  subtotalRow: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  discountText: { ...typography.body, color: colors.success },
  totalRow: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  totalLabel: { ...typography.bodyBold, color: colors.textPrimary },
  addressLabel: { ...typography.bodyBold, color: colors.textPrimary },
  addressLine: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  callRiderRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  callRiderText: { ...typography.bodyBold, color: colors.primary },
  noPhoneText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  paymentPendingTitle: { ...typography.h3, color: colors.danger },
  paymentPendingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  error: { color: colors.danger, marginTop: spacing.sm, textAlign: "center" },
});
