import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { EarningsScreen } from "../screens/EarningsScreen";
import { EditRestaurantScreen } from "../screens/EditRestaurantScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { MenuItemFormScreen } from "../screens/MenuItemFormScreen";
import { OrderDetailScreen } from "../screens/OrderDetailScreen";
import { AppStackParamList } from "./types";
import { MainTabNavigator } from "./MainTabNavigator";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="MenuItemForm" component={MenuItemFormScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="EditRestaurant" component={EditRestaurantScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
    </Stack.Navigator>
  );
}
