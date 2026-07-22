import { Restaurant } from "@restaurant-app/shared";
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

interface RestaurantContextValue {
  restaurant: Restaurant | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(undefined);

export function RestaurantProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setRestaurant(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setRestaurant(await api.getMyRestaurant());
    } catch {
      setRestaurant(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<RestaurantContextValue>(() => ({ restaurant, isLoading, refresh }), [restaurant, isLoading, refresh]);

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error("useRestaurant must be used within a RestaurantProvider");
  return ctx;
}
