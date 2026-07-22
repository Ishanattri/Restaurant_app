import Constants from "expo-constants";
import { createApiClient } from "@restaurant-app/shared";

const API_PORT = 4000;

function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  // Derive the dev machine's LAN IP from the Metro/Expo host so this works
  // in Expo Go on a physical device, not just the simulator (localhost).
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = createApiClient(API_BASE_URL);
