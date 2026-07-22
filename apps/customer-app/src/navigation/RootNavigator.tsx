import { NavigationContainer } from "@react-navigation/native";
import { colors } from "@restaurant-app/shared";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
