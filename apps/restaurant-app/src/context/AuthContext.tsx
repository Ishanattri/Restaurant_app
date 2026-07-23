import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@restaurant-app/shared";
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const TOKEN_KEY = "restaurant-app:token";

// Public OAuth "Web application" client ID from the Firebase project — it also
// ships inside google-services.json, so it is not a secret. All three apps
// request their Google ID token against this same audience.
const GOOGLE_WEB_CLIENT_ID = "896759216436-382r7lr6qhb1su8ldvpharp5ov7akggb.apps.googleusercontent.com";

GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        api.setToken(storedToken);
        try {
          const { user: me } = await api.me();
          setUser(me);
          setToken(storedToken);
        } catch {
          await AsyncStorage.removeItem(TOKEN_KEY);
          api.setToken(null);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      async login(email, password) {
        const { token: newToken, user: loggedInUser } = await api.login({ email, password });
        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        api.setToken(newToken);
        setUser(loggedInUser);
        setToken(newToken);
      },
      async loginWithGoogle() {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        if (!isSuccessResponse(response)) return; // user dismissed the picker
        const idToken = response.data.idToken;
        if (!idToken) throw new Error("Google sign-in did not return a token");
        const { token: newToken, user: googleUser } = await api.googleAuth({ idToken, role: "RESTAURANT_OWNER" });
        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        api.setToken(newToken);
        setUser(googleUser);
        setToken(newToken);
      },
      async register(data) {
        const { token: newToken, user: newUser } = await api.register({ ...data, role: "RESTAURANT_OWNER" });
        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        api.setToken(newToken);
        setUser(newUser);
        setToken(newToken);
      },
      async logout() {
        await AsyncStorage.removeItem(TOKEN_KEY);
        api.setToken(null);
        setUser(null);
        setToken(null);
      },
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
