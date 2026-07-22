import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  apiErrorMessage,
  Button,
  colors,
  distanceKm,
  effectivePrice,
  EmptyState,
  Header,
  Input,
  spacing,
  typography,
} from "@restaurant-app/shared";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLocationContext } from "../context/LocationContext";
import { AppStackParamList } from "../navigation/types";
import { RazorpayCheckout, RazorpaySuccess } from "../components/RazorpayCheckout";
import { MapLocationPicker, PickedLocation } from "../components/MapLocationPicker";

type Props = NativeStackScreenProps<AppStackParamList, "Cart">;

export function CartScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { restaurant, lines, subtotal, discountAmount, addItem, decrementItem, clear } = useCart();
  const { addresses, selectedAddressId, selectAddress, addAddress } = useLocationContext();
  const deliveryFee = restaurant?.deliveryFee ?? 0;
  const total = subtotal - discountAmount + deliveryFee;
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("Home");
  const [newLine1, setNewLine1] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPhone, setNewPhone] = useState(user?.phone ?? "");
  const [newLocation, setNewLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [cutleryRequired, setCutleryRequired] = useState(true);
  const [checkout, setCheckout] = useState<{ orderId: string; keyId: string; razorpayOrderId: string } | null>(null);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  const distanceToRestaurant = useMemo(() => {
    if (!restaurant || !selectedAddress) return null;
    return distanceKm(
      { lat: selectedAddress.lat, lng: selectedAddress.lng },
      { lat: restaurant.lat, lng: restaurant.lng }
    );
  }, [restaurant, selectedAddress]);
  const isOutOfServiceArea =
    restaurant && distanceToRestaurant !== null ? distanceToRestaurant > restaurant.serviceRadiusKm : false;

  function handleMapConfirm(picked: PickedLocation) {
    setNewLocation({ lat: picked.lat, lng: picked.lng });
    if (picked.addressLine && !newLine1) setNewLine1(picked.addressLine);
    if (picked.city && !newCity) setNewCity(picked.city);
    setShowMapPicker(false);
  }

  async function handleAddAddress() {
    if (!newLocation) return;
    setError(undefined);
    try {
      await addAddress({
        label: newLabel.trim() || "Home",
        line1: newLine1.trim(),
        city: newCity.trim(),
        phone: newPhone.trim(),
        lat: newLocation.lat,
        lng: newLocation.lng,
      });
      setShowAddForm(false);
      setNewLine1("");
      setNewCity("");
      setNewLocation(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save address"));
    }
  }

  async function handlePlaceOrder() {
    if (!restaurant || !selectedAddressId) return;
    if (isOutOfServiceArea) {
      setError("This address is outside the restaurant's delivery area — choose a different address");
      return;
    }
    setError(undefined);
    setPlacing(true);
    try {
      const { order, razorpay } = await api.placeOrder({
        restaurantId: restaurant.id,
        deliveryAddressId: selectedAddressId,
        items: lines.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
        paymentMethod,
        notes: note.trim() || undefined,
        cutleryRequired,
      });
      if (paymentMethod === "COD" || !razorpay) {
        clear();
        navigation.replace("OrderDetail", { orderId: order.id });
        return;
      }
      setCheckout({ orderId: order.id, keyId: razorpay.keyId, razorpayOrderId: razorpay.orderId });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not place order"));
    } finally {
      setPlacing(false);
    }
  }

  async function handlePaymentSuccess(result: RazorpaySuccess) {
    if (!checkout) return;
    try {
      await api.verifyPayment(checkout.orderId, result);
      clear();
      const orderId = checkout.orderId;
      setCheckout(null);
      navigation.replace("OrderDetail", { orderId });
    } catch (err) {
      setCheckout(null);
      setError(apiErrorMessage(err, "Payment could not be verified"));
    }
  }

  if (!restaurant || lines.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Your cart" onBack={() => navigation.goBack()} />
        <EmptyState icon="🛒" title="Your cart is empty" subtitle="Add items from a restaurant to get started" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Your cart" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>

        {lines.map((line) => (
          <View key={line.menuItem.id} style={styles.line}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName}>{line.menuItem.name}</Text>
              <Text style={styles.linePrice}>₹{effectivePrice(line.menuItem)} each</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperButton} onPress={() => decrementItem(line.menuItem.id)}>
                <Text style={styles.stepperText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{line.quantity}</Text>
              <TouchableOpacity style={styles.stepperButton} onPress={() => addItem(restaurant, line.menuItem)}>
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.cartActionsRow}>
          <TouchableOpacity
            style={styles.cartActionChip}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cartActionIcon}>➕</Text>
            <Text style={styles.cartActionText} numberOfLines={1}>
              Add more items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartActionChip}
            onPress={() => setShowNoteInput((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.cartActionIcon}>📄</Text>
            <Text style={styles.cartActionText} numberOfLines={1}>
              {note.trim() ? note.trim() : "Add a note for the restaurant"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cartActionChip, !cutleryRequired && styles.cartActionChipActive]}
            onPress={() => setCutleryRequired((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.cartActionIcon}>🍴</Text>
            <Text style={[styles.cartActionText, !cutleryRequired && styles.cartActionTextActive]} numberOfLines={1}>
              {cutleryRequired ? "Don't need cutlery" : "No cutlery needed"}
            </Text>
          </TouchableOpacity>
        </View>

        {showNoteInput ? (
          <View style={styles.noteInputWrap}>
            <Input
              placeholder="e.g. Ring the bell, less spicy, no onions…"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />
            <Button title="Done" variant="outline" onPress={() => setShowNoteInput(false)} style={styles.noteDoneButton} />
          </View>
        ) : null}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal}</Text>
          </View>
          {discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Discount ({restaurant.discountPercent}%)</Text>
              <Text style={styles.discountValue}>−₹{discountAmount}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>{deliveryFee > 0 ? `₹${deliveryFee}` : "Free"}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Deliver to</Text>
        {addresses.map((addr) => {
          const outOfRange = restaurant
            ? distanceKm({ lat: addr.lat, lng: addr.lng }, { lat: restaurant.lat, lng: restaurant.lng }) >
              restaurant.serviceRadiusKm
            : false;
          return (
            <TouchableOpacity
              key={addr.id}
              style={[
                styles.addressCard,
                selectedAddressId === addr.id && styles.addressCardSelected,
                selectedAddressId === addr.id && outOfRange && styles.addressCardOutOfRange,
              ]}
              onPress={() => selectAddress(addr.id)}
            >
              <Text style={styles.addressLabel}>{addr.label}</Text>
              <Text style={styles.addressLine}>
                {addr.line1}, {addr.city}
              </Text>
              {addr.phone ? <Text style={styles.addressPhone}>📞 {addr.phone}</Text> : null}
              {outOfRange ? <Text style={styles.outOfRangeText}>⚠️ Outside delivery area</Text> : null}
            </TouchableOpacity>
          );
        })}

        {showAddForm ? (
          <View style={styles.addForm}>
            <Input label="Label" value={newLabel} onChangeText={setNewLabel} placeholder="Home, Work..." />
            <Input label="Address line" value={newLine1} onChangeText={setNewLine1} placeholder="Street address" />
            <Input label="City" value={newCity} onChangeText={setNewCity} placeholder="City" />
            <Input
              label="Contact phone"
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="For the restaurant & rider to reach you"
              keyboardType="phone-pad"
            />
            <Button
              title={newLocation ? "📍 Location pinned ✓" : "📍 Pick on map"}
              variant="outline"
              onPress={() => setShowMapPicker(true)}
              style={styles.locationButton}
            />
            {!newLocation ? (
              <Text style={styles.hint}>We need your location to check if this restaurant delivers to you.</Text>
            ) : null}
            <Button
              title="Save address"
              variant="outline"
              onPress={handleAddAddress}
              disabled={!newLine1 || !newCity || newPhone.trim().length < 7 || !newLocation}
            />
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowAddForm(true)}>
            <Text style={styles.addAddressLink}>+ Add new address</Text>
          </TouchableOpacity>
        )}

        {isOutOfServiceArea ? (
          <Text style={styles.outOfRangeBanner}>
            ⚠️ This address is outside {restaurant?.name}'s delivery area
            {distanceToRestaurant !== null ? ` (${distanceToRestaurant.toFixed(1)} km away)` : ""}. Choose a
            different address to order.
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Payment method</Text>
        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[styles.paymentCard, paymentMethod === "COD" && styles.paymentCardSelected]}
            onPress={() => setPaymentMethod("COD")}
          >
            <Text style={styles.paymentLabel}>💵 Cash on Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentCard, paymentMethod === "RAZORPAY" && styles.paymentCardSelected]}
            onPress={() => setPaymentMethod("RAZORPAY")}
          >
            <Text style={styles.paymentLabel}>💳 Pay Online</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={
            paymentMethod === "COD"
              ? `Place order · ₹${total} (Cash on Delivery)`
              : `Pay ₹${total} online`
          }
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={!selectedAddressId || isOutOfServiceArea}
        />
      </View>

      {checkout ? (
        <RazorpayCheckout
          visible
          keyId={checkout.keyId}
          orderId={checkout.razorpayOrderId}
          amount={total}
          name={user?.name ?? "Customer"}
          email={user?.email}
          contact={user?.phone ?? undefined}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCheckout(null)}
        />
      ) : null}

      <MapLocationPicker
        visible={showMapPicker}
        initialLocation={newLocation}
        onConfirm={handleMapConfirm}
        onCancel={() => setShowMapPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  restaurantName: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  lineInfo: { flex: 1 },
  lineName: { ...typography.bodyBold, color: colors.textPrimary },
  linePrice: { ...typography.caption, color: colors.textSecondary },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8 },
  stepperButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  stepperText: { color: colors.primary, fontWeight: "700", fontSize: 16 },
  stepperQty: { color: colors.primary, fontWeight: "700", minWidth: 18, textAlign: "center" },
  cartActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  cartActionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: "100%",
  },
  cartActionChipActive: { borderColor: colors.success, backgroundColor: colors.successLight },
  cartActionIcon: { fontSize: 14 },
  cartActionText: { ...typography.captionBold, color: colors.textSecondary, flexShrink: 1 },
  cartActionTextActive: { color: colors.success },
  noteInputWrap: { marginTop: spacing.sm },
  noteInput: { minHeight: 70, textAlignVertical: "top" },
  noteDoneButton: { marginTop: -spacing.xs },
  summary: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.body, color: colors.textPrimary },
  discountLabel: { ...typography.body, color: colors.success },
  discountValue: { ...typography.body, color: colors.success },
  totalRow: { marginTop: spacing.xs, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  totalLabel: { ...typography.h3, color: colors.textPrimary },
  totalValue: { ...typography.h3, color: colors.textPrimary },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  addressCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  addressCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  addressCardOutOfRange: { borderColor: colors.danger, backgroundColor: colors.background },
  addressLabel: { ...typography.bodyBold, color: colors.textPrimary },
  addressLine: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addressPhone: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  outOfRangeText: { ...typography.captionBold, color: colors.danger, marginTop: spacing.xs },
  outOfRangeBanner: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  addForm: { marginTop: spacing.sm },
  locationButton: { marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  addAddressLink: { color: colors.primary, fontWeight: "700", marginTop: spacing.xs },
  paymentOptions: { flexDirection: "row", gap: spacing.sm },
  paymentCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  paymentCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  paymentLabel: { ...typography.bodyBold, color: colors.textPrimary },
  error: { color: colors.danger, marginTop: spacing.md, textAlign: "center" },
  footer: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
