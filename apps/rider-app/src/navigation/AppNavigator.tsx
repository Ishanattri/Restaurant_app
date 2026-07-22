import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActiveDeliveryScreen } from "../screens/ActiveDeliveryScreen";
import { AppStackParamList } from "./types";
import { MainTabNavigator } from "./MainTabNavigator";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </Stack.Navigator>
  );
}
