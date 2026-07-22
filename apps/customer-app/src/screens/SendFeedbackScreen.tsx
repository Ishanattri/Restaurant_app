import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  apiErrorMessage,
  Button,
  colors,
  EmptyState,
  Header,
  Restaurant,
  spacing,
  typography,
} from "@restaurant-app/shared";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "SendFeedback">;

export function SendFeedbackScreen({ navigation }: Props) {
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.myOrders().then((orders) => {
      const byId = new Map<string, Restaurant>();
      orders.forEach((o) => {
        if (o.restaurant) byId.set(o.restaurant.id, o.restaurant);
      });
      const list = Array.from(byId.values());
      setRestaurants(list);
      if (list.length > 0) setSelectedId(list[0].id);
    });
  }, []);

  async function handleSubmit() {
    if (!selectedId || !message.trim()) return;
    setError(undefined);
    setSubmitting(true);
    try {
      await api.submitFeedback({ restaurantId: selectedId, message: message.trim() });
      setMessage("");
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not send your feedback"));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedRestaurant = restaurants?.find((r) => r.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <Header title="Send Feedback" onBack={() => navigation.goBack()} />
      {restaurants === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No restaurants yet"
          subtitle="Order from a restaurant before sending feedback"
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Which restaurant?</Text>
          {restaurants.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.restaurantCard, selectedId === r.id && styles.restaurantCardSelected]}
              onPress={() => {
                setSelectedId(r.id);
                setSent(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.restaurantName, selectedId === r.id && styles.restaurantNameSelected]}>
                {r.name}
              </Text>
              <Text style={styles.restaurantAddress}>{r.address}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Your feedback</Text>
          <TextInput
            style={styles.messageInput}
            placeholder={`What did you think of ${selectedRestaurant?.name ?? "this restaurant"}?`}
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              setSent(false);
            }}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {sent ? <Text style={styles.success}>✓ Feedback sent — thanks for letting them know!</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Send feedback"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!selectedId || !message.trim()}
            style={styles.submitButton}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
  restaurantCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  restaurantCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  restaurantName: { ...typography.bodyBold, color: colors.textPrimary },
  restaurantNameSelected: { color: colors.primary },
  restaurantAddress: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  messageInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 120,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  success: { color: colors.success, textAlign: "center", marginTop: spacing.md, ...typography.bodyBold },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.md },
  submitButton: { marginTop: spacing.lg },
});
