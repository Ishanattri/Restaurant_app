import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { LocationProvider } from "./src/context/LocationContext";
import { NotificationBannerHost, NotificationProvider } from "./src/context/NotificationContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

// Keep the UI a fixed size regardless of the phone's system font-size setting, so
// Android (which honors it by default) doesn't render everything larger than iOS.
const textDefaults = Text as unknown as { defaultProps?: { allowFontScaling?: boolean } };
textDefaults.defaultProps = { ...(textDefaults.defaultProps ?? {}), allowFontScaling: false };
const inputDefaults = TextInput as unknown as { defaultProps?: { allowFontScaling?: boolean } };
inputDefaults.defaultProps = { ...(inputDefaults.defaultProps ?? {}), allowFontScaling: false };

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <NotificationProvider>
              <CartProvider>
                <RootNavigator />
                <NotificationBannerHost />
                <StatusBar style="dark" />
              </CartProvider>
            </NotificationProvider>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
