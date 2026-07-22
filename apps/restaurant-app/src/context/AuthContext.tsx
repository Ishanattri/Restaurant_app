import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@restaurant-app/shared";
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const TOKEN_KEY = "restaurant-app:token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
