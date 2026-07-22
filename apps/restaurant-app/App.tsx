import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationBannerHost, NotificationProvider } from "./src/context/NotificationContext";
import { RestaurantProvider } from "./src/context/RestaurantContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <RestaurantProvider>
              <RootNavigator />
              <NotificationBannerHost />
              <StatusBar style="dark" />
            </RestaurantProvider>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
