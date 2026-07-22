export const ROLES = ["CUSTOMER", "RESTAURANT_OWNER", "RIDER"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  cuisine?: string | null;
  phone?: string | null;
  address: string;
  lat: number;
  lng: number;
  imageUrl?: string | null;
  isOpen: boolean;
  rating: number;
  deliveryFee: number;
  discountPercent: number;
  serviceRadiusKm: number;
  createdAt: string;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
  isVeg: boolean;
  isAvailable: boolean;
  discountPercent: number;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
}

export interface RiderProfile {
  id: string;
  userId: string;
  vehicleType: string;
  isAvailable: boolean;
  currentLat?: number | null;
  currentLng?: number | null;
  user?: { id: string; name: string; phone?: string | null } | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  riderId?: string | null;
  deliveryAddressId: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpayKeyId?: string;
  notes?: string | null;
  cutleryRequired: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  restaurant?: Restaurant;
  deliveryAddress?: Address;
  rider?: RiderProfile | null;
  customer?: { id: string; name: string; phone?: string | null } | null;
}

export interface RazorpayCheckoutDetails {
  keyId: string;
  orderId: string;
}

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

export interface Feedback {
  id: string;
  customerId: string;
  restaurantId: string;
  message: string;
  createdAt: string;
  customer?: { id: string; name: string; phone?: string | null; email?: string } | null;
}

export interface EarningsSummary {
  totalEarnings: number;
  totalOrders: number;
  avgOrderValue: number;
  codEarnings: number;
  codOrders: number;
  onlineEarnings: number;
  onlineOrders: number;
  totalDeliveryFees: number;
}

export interface EarningsOrderRow {
  id: string;
  createdAt: string;
  customerName: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  restaurantEarning: number;
}
