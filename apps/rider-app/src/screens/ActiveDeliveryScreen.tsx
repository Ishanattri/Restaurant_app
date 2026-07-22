import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  apiErrorMessage,
  Button,
  Card,
  colors,
  createOrderSocket,
  Header,
  Order,
  OrderStatus,
  spacing,
  StatusPill,
  typography,
} from "@restaurant-app/shared";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL, api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DeliveryMap } from "../components/DeliveryMap";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "ActiveDelivery">;

const TRANSIT_STATUSES: OrderStatus[] = ["PICKED_UP", "ON_THE_WAY"];

export function ActiveDeliveryScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sharingLocation, setSharingLocation] = useState(false);
  const locationErrorShown = useRef(false);

  const load = useCallback(async () => {
    setOrder(await api.getOrder(orderId));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Stream GPS coordinates to the backend (which broadcasts them to the customer's
  // tracking screen) for as long as this delivery is actually in transit.
  useEffect(() => {
    if (!token || !order || !TRANSIT_STATUSES.includes(order.status)) {
      setSharingLocation(false);
      return;
    }

    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    const socket = createOrderSocket(API_BASE_URL, token);

    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        if (!locationErrorShown.current) {
          locationErrorShown.current = true;
          setError("Location permission is required to share your position with the customer");
        }
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 15 },
        (position) => {
          if (cancelled) return;
          socket.emit("rider:location", {
            orderId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      );
      if (!cancelled) setSharingLocation(true);
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      socket.disconnect();
      setSharingLocation(false);
    };
  }, [token, order?.status, orderId]);

  async function handleUpdateStatus(status: OrderStatus) {
    setError(undefined);
    setUpdating(true);
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrder(updated);
      if (status === "DELIVERED") {
        navigation.navigate("MainTabs", { screen: "Deliveries" });
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update this delivery"));
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

  return (
    <View style={styles.container}>
      <Header title="Active delivery" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
            <StatusPill status={order.status} />
          </View>
          {sharingLocation ? <Text style={styles.sharingNote}>📡 Sharing your live location</Text> : null}
        </Card>

        {order.restaurant && order.deliveryAddress ? (
          <DeliveryMap restaurant={order.restaurant} deliveryAddress={order.deliveryAddress} />
        ) : null}

        <Text style={styles.sectionTitle}>Pickup from</Text>
        <Card>
          <Text style={styles.placeName}>{order.restaurant?.name}</Text>
          <Text style={styles.placeAddress}>{order.restaurant?.address}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Deliver to</Text>
        <Card>
          <Text style={styles.placeName}>{order.deliveryAddress?.label}</Text>
          <Text style={styles.placeAddress}>
            {order.deliveryAddress?.line1}, {order.deliveryAddress?.city}
          </Text>
          {order.deliveryAddress?.phone ? (
            <TouchableOpacity
              style={styles.callRow}
              onPress={() => Linking.openURL(`tel:${order.deliveryAddress!.phone}`)}
            >
              <Text style={styles.callText}>📞 Call customer · {order.deliveryAddress.phone}</Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        <Text style={styles.sectionTitle}>Items</Text>
        <Card>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.quantity}× {item.name}
              </Text>
            </View>
          ))}
          <View style={[styles.itemRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              {order.paymentMethod === "COD" ? "Collect (Cash on delivery)" : "Paid online — nothing to collect"}
            </Text>
            <Text style={styles.totalLabel}>₹{order.total}</Text>
          </View>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {order.status === "READY_FOR_PICKUP" ? (
          <Button title="Confirm pickup" onPress={() => handleUpdateStatus("PICKED_UP")} loading={updating} />
        ) : null}
        {order.status === "PICKED_UP" ? (
          <Button title="Start delivering" onPress={() => handleUpdateStatus("ON_THE_WAY")} loading={updating} />
        ) : null}
        {order.status === "ON_THE_WAY" ? (
          <Button title="Mark delivered" onPress={() => handleUpdateStatus("DELIVERED")} loading={updating} />
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
  sharingNote: { ...typography.captionBold, color: colors.success, marginTop: spacing.sm },
  placeName: { ...typography.bodyBold, color: colors.textPrimary },
  placeAddress: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  callRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  callText: { ...typography.bodyBold, color: colors.primary },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  itemName: { ...typography.body, color: colors.textPrimary },
  totalRow: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  totalLabel: { ...typography.bodyBold, color: colors.textPrimary },
  error: { color: colors.danger, textAlign: "center" },
});
