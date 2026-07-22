import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiErrorMessage, Button, colors, Input, spacing, typography } from "@restaurant-app/shared";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(undefined);
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your account"));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name && email && phone.trim().length >= 7 && password.length >= 6;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Become a rider</Text>
        <Text style={styles.subtitle}>Deliver orders and earn on your schedule</Text>

        <View style={styles.form}>
          <Input label="Your name" value={name} onChangeText={setName} placeholder="Karan Singh" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="For customers & restaurants to reach you"
          />
          <Text style={styles.hint}>Required so customers and restaurants can contact you during delivery.</Text>
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 6 characters"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Create account" onPress={handleRegister} loading={loading} disabled={!canSubmit} />
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footerText}>
            Already a rider? <Text style={styles.footerLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  title: { ...typography.h1, textAlign: "center", color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.xs },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: -spacing.xs, marginBottom: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: "center" },
  footer: { marginTop: spacing.xl },
  footerText: { ...typography.body, textAlign: "center", color: colors.textSecondary },
  footerLink: { color: colors.primary, fontWeight: "700" },
});
