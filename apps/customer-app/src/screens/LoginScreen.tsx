import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { apiErrorMessage, Button, colors, Input, spacing, typography } from "@restaurant-app/shared";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("customer@test.dev");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to order from your favorite restaurants</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Log in" onPress={handleLogin} loading={loading} disabled={!email || !password} />
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.footerText}>
            Don&apos;t have an account? <Text style={styles.footerLink}>Sign up</Text>
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
  footer: { marginTop: spacing.xl },
  footerText: { ...typography.body, textAlign: "center", color: colors.textSecondary },
  footerLink: { color: colors.primary, fontWeight: "700" },
});
