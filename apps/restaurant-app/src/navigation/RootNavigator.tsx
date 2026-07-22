import { NavigationContainer } from "@react-navigation/native";
import { colors } from "@restaurant-app/shared";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";
import { CreateRestaurantScreen } from "../screens/CreateRestaurantScreen";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function RootNavigator() {
  const { user, isLoading: authLoading } = useAuth();
  const { restaurant, isLoading: restaurantLoading } = useRestaurant();

  if (authLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : restaurantLoading ? (
        <LoadingScreen />
      ) : !restaurant ? (
        <CreateRestaurantScreen />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}
