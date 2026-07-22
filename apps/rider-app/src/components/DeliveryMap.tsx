import { Address, colors, Restaurant, spacing } from "@restaurant-app/shared";
import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface DeliveryMapProps {
  restaurant: Restaurant;
  deliveryAddress: Address;
}

// Native implementation (iOS/Android). A separate DeliveryMap.web.tsx provides
// the web fallback, since react-native-maps has no web renderer — Metro resolves
// the .web.tsx variant automatically when bundling for the web platform.
export function DeliveryMap({ restaurant, deliveryAddress }: DeliveryMapProps) {
  const coords = [
    { latitude: restaurant.lat, longitude: restaurant.lng },
    { latitude: deliveryAddress.lat, longitude: deliveryAddress.lng },
  ];
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const region = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: Math.max(0.02, (Math.max(...lats) - Math.min(...lats)) * 1.8),
    longitudeDelta: Math.max(0.02, (Math.max(...lngs) - Math.min(...lngs)) * 1.8),
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        <Marker
          coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
          title={restaurant.name}
          description="Pickup"
          pinColor={colors.warning}
        />
        <Marker
          coordinate={{ latitude: deliveryAddress.lat, longitude: deliveryAddress.lng }}
          title={deliveryAddress.label}
          description="Customer's location"
          pinColor={colors.primary}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: "hidden", marginBottom: spacing.md },
  map: { width: "100%", height: 220 },
});
