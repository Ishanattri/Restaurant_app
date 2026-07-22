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
