import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiErrorMessage, Button, colors, Input, spacing, typography } from "@restaurant-app/shared";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("rider@test.dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    setError(undefined);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not log in"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(undefined);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not sign in with Google"));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>🛵</Text>
        <Text style={styles.title}>Rider</Text>
        <Text style={styles.subtitle}>Accept deliveries and get moving</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Log in" onPress={handleLogin} loading={loading} disabled={!email || !password} />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogle}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.footerText}>
            New rider? <Text style={styles.footerLink}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  logo: { fontSize: 56, textAlign: "center", marginBottom: spacing.md },
  title: { ...typography.h1, textAlign: "center", color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: { gap: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginVertical: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textSecondary },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  googleG: { fontSize: 20, fontWeight: "800", color: "#4285F4" },
  googleText: { ...typography.body, fontWeight: "700", color: colors.textPrimary },
  footer: { marginTop: spacing.xl },
  footerText: { ...typography.body, textAlign: "center", color: colors.textSecondary },
  footerLink: { color: colors.primary, fontWeight: "700" },
});
