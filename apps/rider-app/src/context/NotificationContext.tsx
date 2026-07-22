import { createAuthedSocket, NotificationBanner, NotificationPayload } from "@restaurant-app/shared";
import * as Notifications from "expo-notifications";
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL, api } from "../api/client";
import { registerForPushNotificationsAsync } from "../utils/registerPushNotifications";
import { useAuth } from "./AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

interface NotificationContextValue {
  latestNotification: NotificationPayload | null;
  dismissNotification: () => void;
  deliveriesUnreadCount: number;
  clearDeliveriesUnread: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: PropsWithChildren) {
  const { token } = useAuth();
  const [latestNotification, setLatestNotification] = useState<NotificationPayload | null>(null);
  const [deliveriesUnreadCount, setDeliveriesUnreadCount] = useState(0);

  // Live in-app notifications over a persistent, authenticated socket connection.
  useEffect(() => {
    if (!token) return;
    const socket = createAuthedSocket(API_BASE_URL, token);
    socket.on("notification", (payload: NotificationPayload) => {
      setLatestNotification(payload);
      setDeliveriesUnreadCount((c) => c + 1);
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Best-effort remote push registration (see registerPushNotifications.ts).
  useEffect(() => {
    if (!token) return;
    registerForPushNotificationsAsync().then((pushToken) => {
      if (pushToken) api.registerPushToken(pushToken).catch(() => {});
    });
  }, [token]);

  return (
    <NotificationContext.Provider
      value={{
        latestNotification,
        dismissNotification: () => setLatestNotification(null),
        deliveriesUnreadCount,
        clearDeliveriesUnread: () => setDeliveriesUnreadCount(0),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}

/** Renders the in-app banner for whatever notification just arrived. Mount once near the app root. */
export function NotificationBannerHost() {
  const { latestNotification, dismissNotification } = useNotifications();
  const insets = useSafeAreaInsets();
  return (
    <NotificationBanner
      notification={latestNotification}
      onHide={dismissNotification}
      onPress={dismissNotification}
      topOffset={insets.top + 8}
    />
  );
}
