import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors, shadow } from "@restaurant-app/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNotifications } from "../context/NotificationContext";
import { HomeScreen } from "../screens/HomeScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Home: "🏠",
  Orders: "📦",
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
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingTop: 6 },
        tabBarIcon: ({ focused }) => (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>{ICONS[route.name]}</Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarLabel: "Orders", tabBarBadge: ordersUnreadCount > 0 ? ordersUnreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 88,
    paddingBottom: 24,
    paddingTop: 6,
    backgroundColor: colors.white,
    borderTopWidth: 0,
    ...shadow.floating,
  },
  tabLabel: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: colors.primaryLight },
});
