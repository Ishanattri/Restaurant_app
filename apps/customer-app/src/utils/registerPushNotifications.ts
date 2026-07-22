import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Best-effort remote push registration. Returns null (and never throws)
 * whenever this can't succeed — most commonly because the app has no EAS
 * project configured yet, which is expected until `eas init` has been run.
 * In-app notifications work regardless of this.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  if (!projectId) {
    console.log("Push notifications: no EAS project configured yet, skipping remote push registration.");
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    console.log("Push notifications: could not obtain a push token", err);
    return null;
  }
}
