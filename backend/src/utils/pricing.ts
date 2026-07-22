/** Rounds to 2 decimal places to avoid floating point artifacts (e.g. 159.99999999). */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Price after applying a menu item's own discount percentage. */
export function effectivePrice(price: number, discountPercent: number): number {
  if (!discountPercent) return price;
  return round2(price * (1 - discountPercent / 100));
}

/** Amount knocked off a subtotal by a restaurant-wide discount percentage. */
export function discountAmountFor(subtotal: number, discountPercent: number): number {
  if (!discountPercent) return 0;
  return round2(subtotal * (discountPercent / 100));
}
