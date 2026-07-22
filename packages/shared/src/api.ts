import axios, { AxiosInstance } from "axios";
import {
  Address,
  EarningsOrderRow,
  EarningsSummary,
  Feedback,
  MenuItem,
  Order,
  OrderStatus,
  RazorpayCheckoutDetails,
  Restaurant,
  Role,
  User,
} from "./types";

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

function buildFormData(fields: Record<string, unknown>, image?: ImageFile): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  if (image) {
    // React Native's FormData accepts this shape for file uploads.
    formData.append("image", image as unknown as Blob);
  }
  return formData;
}

export function createApiClient(baseURL: string) {
  const client: AxiosInstance = axios.create({ baseURL });
  let token: string | null = null;

  client.interceptors.request.use((config) => {
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return {
    setToken(t: string | null) {
      token = t;
    },
    getBaseURL() {
      return baseURL;
    },

    // --- Auth ---
    async register(data: { email: string; password: string; name: string; phone?: string; role: Role }) {
      const res = await client.post<{ token: string; user: User }>("/api/auth/register", data);
      return res.data;
    },
    async login(data: { email: string; password: string }) {
      const res = await client.post<{ token: string; user: User }>("/api/auth/login", data);
      return res.data;
    },
    async me() {
      const res = await client.get<{ user: User & { restaurant?: Restaurant; riderProfile?: unknown } }>(
        "/api/auth/me"
      );
      return res.data;
    },
    async registerPushToken(token: string) {
      await client.post("/api/auth/push-token", { token });
    },

    // --- Restaurants ---
    async listRestaurants(search?: string) {
      const res = await client.get<{ restaurants: Restaurant[] }>("/api/restaurants", {
        params: search ? { search } : undefined,
      });
      return res.data.restaurants;
    },
    async getRestaurant(id: string) {
      const res = await client.get<{ restaurant: Restaurant }>(`/api/restaurants/${id}`);
      return res.data.restaurant;
    },
    async getMyRestaurant() {
      const res = await client.get<{ restaurant: Restaurant }>("/api/restaurants/mine");
      return res.data.restaurant;
    },
    async createRestaurant(
      data: {
        name: string;
        description?: string;
        cuisine?: string;
        phone?: string;
        address: string;
        lat: number;
        lng: number;
        deliveryFee?: number;
        discountPercent?: number;
        serviceRadiusKm?: number;
      },
      image?: ImageFile
    ) {
      const res = await client.post<{ restaurant: Restaurant }>(
        "/api/restaurants",
        buildFormData(data, image),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data.restaurant;
    },
    async updateRestaurant(id: string, data: Record<string, unknown>, image?: ImageFile) {
      const res = await client.patch<{ restaurant: Restaurant }>(
        `/api/restaurants/${id}`,
        buildFormData(data, image),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data.restaurant;
    },

    // --- Menu items ---
    async createMenuItem(
      restaurantId: string,
      data: {
        name: string;
        description?: string;
        price: number;
        category: string;
        isVeg?: boolean;
        discountPercent?: number;
      },
      image?: ImageFile
    ) {
      const res = await client.post<{ menuItem: MenuItem }>(
        `/api/restaurants/${restaurantId}/menu-items`,
        buildFormData(data, image),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data.menuItem;
    },
    async updateMenuItem(id: string, data: Record<string, unknown>, image?: ImageFile) {
      const res = await client.patch<{ menuItem: MenuItem }>(
        `/api/menu-items/${id}`,
        buildFormData(data, image),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data.menuItem;
    },
    async deleteMenuItem(id: string) {
      await client.delete(`/api/menu-items/${id}`);
    },

    // --- Addresses ---
    async listAddresses() {
      const res = await client.get<{ addresses: Address[] }>("/api/addresses");
      return res.data.addresses;
    },
    async createAddress(data: { label: string; line1: string; city: string; lat: number; lng: number; phone: string }) {
      const res = await client.post<{ address: Address }>("/api/addresses", data);
      return res.data.address;
    },
    async deleteAddress(id: string) {
      await client.delete(`/api/addresses/${id}`);
    },

    // --- Orders ---
    async placeOrder(data: {
      restaurantId: string;
      deliveryAddressId: string;
      items: { menuItemId: string; quantity: number }[];
      paymentMethod?: "COD" | "RAZORPAY";
      notes?: string;
      cutleryRequired?: boolean;
    }) {
      const res = await client.post<{ order: Order; razorpay?: RazorpayCheckoutDetails }>("/api/orders", data);
      return res.data;
    },
    async verifyPayment(
      orderId: string,
      data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
    ) {
      const res = await client.post<{ order: Order }>(`/api/orders/${orderId}/verify-payment`, data);
      return res.data.order;
    },
    async myOrders() {
      const res = await client.get<{ orders: Order[] }>("/api/orders/me");
      return res.data.orders;
    },
    async restaurantOrders() {
      const res = await client.get<{ orders: Order[] }>("/api/orders/restaurant/mine");
      return res.data.orders;
    },
    async availableDeliveries() {
      const res = await client.get<{ orders: Order[] }>("/api/orders/available");
      return res.data.orders;
    },
    async myDeliveries() {
      const res = await client.get<{ orders: Order[] }>("/api/orders/deliveries/mine");
      return res.data.orders;
    },
    async getOrder(id: string) {
      const res = await client.get<{ order: Order }>(`/api/orders/${id}`);
      return res.data.order;
    },
    async assignRider(orderId: string) {
      const res = await client.post<{ order: Order }>(`/api/orders/${orderId}/assign-rider`);
      return res.data.order;
    },
    async updateOrderStatus(orderId: string, status: OrderStatus) {
      const res = await client.patch<{ order: Order }>(`/api/orders/${orderId}/status`, { status });
      return res.data.order;
    },

    // --- Feedback ---
    async submitFeedback(data: { restaurantId: string; message: string }) {
      const res = await client.post<{ feedback: Feedback }>("/api/feedback", data);
      return res.data.feedback;
    },
    async myFeedback() {
      const res = await client.get<{ feedback: Feedback[] }>("/api/feedback/mine");
      return res.data.feedback;
    },
    async restaurantFeedback() {
      const res = await client.get<{ feedback: Feedback[] }>("/api/feedback/restaurant/mine");
      return res.data.feedback;
    },

    // --- Earnings ---
    async restaurantEarnings(params?: { from?: string; to?: string }) {
      const res = await client.get<{ summary: EarningsSummary; orders: EarningsOrderRow[] }>(
        "/api/orders/restaurant/earnings",
        { params }
      );
      return res.data;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Extracts a human-readable message from an API error response. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return fallback;
}
