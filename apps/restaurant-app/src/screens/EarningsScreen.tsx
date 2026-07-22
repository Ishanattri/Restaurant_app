import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card, colors, EarningsOrderRow, EarningsSummary, EmptyState, Header, spacing, typography } from "@restaurant-app/shared";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { utils, write } from "xlsx";
import { api } from "../api/client";
import { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Earnings">;

type PresetKey = "today" | "week" | "month" | "all" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom" },
];

function startOfDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(d: Date): Date {
  const next = startOfDay(d);
  const day = next.getDay();
  const diff = day === 0 ? 6 : day - 1; // week starts Monday
  next.setDate(next.getDate() - diff);
  return next;
}

function startOfMonth(d: Date): Date {
  const next = startOfDay(d);
  next.setDate(1);
  return next;
}

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatMoney(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function EarningsScreen({ navigation }: Props) {
  const [preset, setPreset] = useState<PresetKey>("month");
  const [customFrom, setCustomFrom] = useState(toDateInputValue(startOfMonth(new Date())));
  const [customTo, setCustomTo] = useState(toDateInputValue(new Date()));
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [orders, setOrders] = useState<EarningsOrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const range = useMemo(() => {
    const now = new Date();
    if (preset === "today") return { from: startOfDay(now).toISOString(), to: now.toISOString() };
    if (preset === "week") return { from: startOfWeek(now).toISOString(), to: now.toISOString() };
    if (preset === "month") return { from: startOfMonth(now).toISOString(), to: now.toISOString() };
    if (preset === "custom") {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      return {
        from: isNaN(from.getTime()) ? undefined : from.toISOString(),
        to: isNaN(to.getTime()) ? undefined : to.toISOString(),
      };
    }
    return { from: undefined, to: undefined };
  }, [preset, customFrom, customTo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await api.restaurantEarnings(range);
      setSummary(data.summary);
      setOrders(data.orders);
    } catch {
      setError("Could not load earnings");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    if (!orders || orders.length === 0) return;
    setExporting(true);
    try {
      const rows = orders.map((o) => ({
        Date: formatDate(o.createdAt),
        Customer: o.customerName,
        "Payment Method": o.paymentMethod === "COD" ? "Cash on Delivery" : "Paid Online",
        Subtotal: o.subtotal,
        Discount: o.discountAmount,
        "Delivery Fee": o.deliveryFee,
        "Order Total": o.total,
        "Your Earning": o.restaurantEarning,
      }));
      const worksheet = utils.json_to_sheet(rows);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Earnings");
      const base64 = write(workbook, { type: "base64", bookType: "xlsx" });

      const fileUri = `${FileSystem.cacheDirectory}earnings-${preset}-${Date.now()}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export earnings",
          UTI: "com.microsoft.excel.xlsx",
        });
      } else {
        Alert.alert("Export ready", `Saved to ${fileUri}`);
      }
    } catch {
      Alert.alert("Export failed", "Could not export earnings to Excel");
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Earnings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.presetRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.presetChip, preset === p.key && styles.presetChipActive]}
              onPress={() => setPreset(p.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, preset === p.key && styles.presetTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {preset === "custom" ? (
          <View style={styles.customRow}>
            <View style={styles.customField}>
              <Text style={styles.customLabel}>From</Text>
              <TextInput
                style={styles.customInput}
                value={customFrom}
                onChangeText={setCustomFrom}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.customField}>
              <Text style={styles.customLabel}>To</Text>
              <TextInput
                style={styles.customInput}
                value={customTo}
                onChangeText={setCustomTo}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : summary ? (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total earnings</Text>
              <Text style={styles.summaryValue}>{formatMoney(summary.totalEarnings)}</Text>
              <Text style={styles.summarySubtitle}>
                from {summary.totalOrders} delivered order{summary.totalOrders === 1 ? "" : "s"}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatMoney(summary.avgOrderValue)}</Text>
                  <Text style={styles.statLabel}>Avg. order</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatMoney(summary.codEarnings)}</Text>
                  <Text style={styles.statLabel}>Cash ({summary.codOrders})</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatMoney(summary.onlineEarnings)}</Text>
                  <Text style={styles.statLabel}>Online ({summary.onlineOrders})</Text>
                </View>
              </View>

              <Text style={styles.footnote}>
                Delivery fees collected (not included above): {formatMoney(summary.totalDeliveryFees)}
              </Text>
            </Card>

            <TouchableOpacity
              style={[styles.exportButton, (!orders || orders.length === 0) && styles.exportButtonDisabled]}
              onPress={handleExport}
              disabled={!orders || orders.length === 0 || exporting}
              activeOpacity={0.85}
            >
              {exporting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.exportButtonText}>📊 Export to Excel</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Orders</Text>
            {orders && orders.length > 0 ? (
              orders.map((o) => (
                <Card key={o.id} style={styles.orderCard}>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderCustomer}>{o.customerName}</Text>
                    <Text style={styles.orderEarning}>{formatMoney(o.restaurantEarning)}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderMeta}>{formatDate(o.createdAt)}</Text>
                    <Text style={styles.orderMeta}>{o.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}</Text>
                  </View>
                </Card>
              ))
            ) : (
              <EmptyState icon="💰" title="No earnings yet" subtitle="Delivered orders in this period will show up here" />
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.xl, alignItems: "center" },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.lg },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  presetChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  presetChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  presetText: { ...typography.captionBold, color: colors.textSecondary },
  presetTextActive: { color: colors.primary },
  customRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  customField: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
  },
  customLabel: { ...typography.caption, color: colors.textMuted },
  customInput: { ...typography.bodyBold, color: colors.textPrimary, marginTop: 2, padding: 0 },
  summaryCard: { marginBottom: spacing.md },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.display, color: colors.textPrimary, marginTop: spacing.xs },
  summarySubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  statBox: { alignItems: "center", flex: 1 },
  statValue: { ...typography.bodyBold, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2, textAlign: "center" },
  footnote: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  exportButton: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  exportButtonDisabled: { opacity: 0.5 },
  exportButtonText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  orderCard: { marginBottom: spacing.sm },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  orderCustomer: { ...typography.bodyBold, color: colors.textPrimary },
  orderEarning: { ...typography.bodyBold, color: colors.success },
  orderMeta: { ...typography.caption, color: colors.textMuted },
});
