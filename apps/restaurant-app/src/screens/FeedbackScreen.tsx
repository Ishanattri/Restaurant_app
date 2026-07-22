import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card, colors, EmptyState, Feedback, Header, spacing, typography } from "@restaurant-app/shared";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { api } from "../api/client";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Feedback">;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function FeedbackScreen({ navigation }: Props) {
  const [feedback, setFeedback] = useState<Feedback[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setFeedback(await api.restaurantFeedback());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Header title="Customer Feedback" onBack={() => navigation.goBack()} />
      {feedback === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={feedback}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <EmptyState icon="💬" title="No feedback yet" subtitle="Customer feedback will show up here" />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.customerName}>{item.customer?.name ?? "Unknown customer"}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
              {item.customer?.phone ? (
                <TouchableOpacity
                  style={styles.callRow}
                  onPress={() => Linking.openURL(`tel:${item.customer!.phone}`)}
                >
                  <Text style={styles.callText}>📞 {item.customer.phone}</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  customerName: { ...typography.bodyBold, color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textMuted },
  message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  callRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  callText: { ...typography.bodyBold, color: colors.primary },
});
