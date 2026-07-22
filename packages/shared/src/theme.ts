import { Platform, TextStyle } from "react-native";
import { OrderStatus } from "./types";

export const colors = {
  primary: "#FF4B3E",
  primaryDark: "#E23E32",
  primaryLight: "#FFEBE9",
  background: "#FFFFFF",
  surface: "#F6F7F9",
  surfaceAlt: "#EFF1F4",
  border: "#EAEBEF",
  borderStrong: "#DDDEE4",
  textPrimary: "#15151A",
  textSecondary: "#6E6E76",
  textMuted: "#A0A0A8",
  success: "#1AA260",
  successLight: "#E6F7EF",
  warning: "#D9820D",
  warningLight: "#FDF3E3",
  danger: "#E0433A",
  dangerLight: "#FBE9E8",
  star: "#F5A623",
  white: "#FFFFFF",
  black: "#000000",
  // Overlays for imagery (text legibility on photos).
  scrimTop: "rgba(0,0,0,0)",
  scrimBottom: "rgba(0,0,0,0.55)",
};

export const orderStatusColor: Record<OrderStatus, { fg: string; bg: string; label: string }> = {
  PLACED: { fg: colors.warning, bg: colors.warningLight, label: "Order placed" },
  ACCEPTED: { fg: colors.warning, bg: colors.warningLight, label: "Accepted" },
  PREPARING: { fg: colors.warning, bg: colors.warningLight, label: "Preparing" },
  READY_FOR_PICKUP: { fg: "#2563EB", bg: "#E7EEFD", label: "Ready for pickup" },
  PICKED_UP: { fg: "#2563EB", bg: "#E7EEFD", label: "Picked up" },
  ON_THE_WAY: { fg: "#2563EB", bg: "#E7EEFD", label: "On the way" },
  DELIVERED: { fg: colors.success, bg: colors.successLight, label: "Delivered" },
  CANCELLED: { fg: colors.danger, bg: colors.dangerLight, label: "Cancelled" },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

// Cross-platform typography. Both platforms use their native system font (San Francisco
// on iOS, Roboto on Android) via fontWeight — this is the reliable default that never
// falls back to a broken font. On Android we additionally strip the extra
// `includeFontPadding` so text blocks aren't taller/bulkier than on iOS.
type FontWeight = "400" | "500" | "600" | "700" | "800";

const androidTextFix: TextStyle = Platform.OS === "android" ? { includeFontPadding: false } : {};

function font(
  fontSize: number,
  weight: FontWeight,
  opts: { letterSpacing?: number; lineHeight?: number } = {}
): TextStyle {
  return { fontSize, fontWeight: weight, ...androidTextFix, ...opts };
}

export const typography = {
  display: font(32, "800", { letterSpacing: -0.6, lineHeight: 38 }),
  h1: font(28, "800", { letterSpacing: -0.5, lineHeight: 34 }),
  h2: font(22, "700", { letterSpacing: -0.4, lineHeight: 28 }),
  h3: font(18, "700", { letterSpacing: -0.2, lineHeight: 24 }),
  body: font(15, "400", { lineHeight: 21 }),
  bodyBold: font(15, "600", { lineHeight: 21 }),
  caption: font(13, "400", { lineHeight: 18 }),
  captionBold: font(13, "600", { lineHeight: 18 }),
};

/** Android text-padding fix for the handful of styles that set fontWeight directly
 *  (badges, steppers) rather than going through a typography token. No-op on iOS. */
export function fontFamilyFor(_weight: FontWeight): TextStyle {
  return androidTextFix;
}

export const shadow = {
  card: {
    shadowColor: "#101024",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: "#101024",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  primary: {
    shadowColor: "#FF4B3E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
};
