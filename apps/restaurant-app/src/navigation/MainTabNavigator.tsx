import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "@restaurant-app/shared";
import React from "react";
import { Text } from "react-native";
import { useNotifications } from "../context/NotificationContext";
import { MenuScreen } from "../screens/MenuScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Menu: "🍲",
  Orders: "📋",
  Profile: "👤",
};

export function MainTabNavigator() {
  const { ordersUnreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarBadge: ordersUnreadCount > 0 ? ordersUnreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
