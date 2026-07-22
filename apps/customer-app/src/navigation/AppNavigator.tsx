import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { CartScreen } from "../screens/CartScreen";
import { ContactRestaurantScreen } from "../screens/ContactRestaurantScreen";
import { OrderDetailScreen } from "../screens/OrderDetailScreen";
import { RestaurantDetailScreen } from "../screens/RestaurantDetailScreen";
import { SendFeedbackScreen } from "../screens/SendFeedbackScreen";
import { AppStackParamList } from "./types";
import { MainTabNavigator } from "./MainTabNavigator";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="SendFeedback" component={SendFeedbackScreen} />
      <Stack.Screen name="ContactRestaurant" component={ContactRestaurantScreen} />
    </Stack.Navigator>
  );
}
