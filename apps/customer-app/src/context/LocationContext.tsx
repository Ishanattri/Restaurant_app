import AsyncStorage from "@react-native-async-storage/async-storage";
import { Address } from "@restaurant-app/shared";
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const SELECTED_ADDRESS_KEY = "customer-app:selectedAddressId";

interface LocationContextValue {
  addresses: Address[];
  selectedAddress: Address | null;
  selectedAddressId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  selectAddress: (id: string) => void;
  addAddress: (data: {
    label: string;
    line1: string;
    city: string;
    phone: string;
    lat: number;
    lng: number;
  }) => Promise<Address>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: PropsWithChildren) {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await api.listAddresses();
      setAddresses(list);
      setSelectedAddressId((current) => {
        if (current && list.some((a) => a.id === current)) return current;
        return list.length > 0 ? list[0].id : null;
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setAddresses([]);
      setSelectedAddressId(null);
      setLoading(false);
      return;
    }
    (async () => {
      const stored = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
      if (stored) setSelectedAddressId(stored);
      await refresh();
    })();
  }, [token, refresh]);

  function selectAddress(id: string) {
    setSelectedAddressId(id);
    AsyncStorage.setItem(SELECTED_ADDRESS_KEY, id).catch(() => {});
  }

  async function addAddress(data: {
    label: string;
    line1: string;
    city: string;
    phone: string;
    lat: number;
    lng: number;
  }) {
    const address = await api.createAddress(data);
    setAddresses((prev) => [...prev, address]);
    selectAddress(address.id);
    return address;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  return (
    <LocationContext.Provider
      value={{ addresses, selectedAddress, selectedAddressId, loading, refresh, selectAddress, addAddress }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within a LocationProvider");
  return ctx;
}
