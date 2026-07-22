import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "@restaurant-app/shared";
import React from "react";
import { Text } from "react-native";
import { useNotifications } from "../context/NotificationContext";
import { DeliveriesScreen } from "../screens/DeliveriesScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Deliveries: "🛵",
  History: "🗂️",
  Profile: "👤",
};

export function MainTabNavigator() {
  const { deliveriesUnreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen
        name="Deliveries"
        component={DeliveriesScreen}
        options={{ tabBarBadge: deliveriesUnreadCount > 0 ? deliveriesUnreadCount : undefined }}
      />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
