# Restaurant App — Multi-Restaurant Ordering & Delivery Platform

A Zomato/Swiggy-style MVP: restaurants list menus and manage orders, customers browse and order (cash on delivery), and riders deliver orders while streaming their live location to the customer's tracking screen.

## Architecture

```
restaurant App/
├── backend/                 Node.js + Express + TypeScript API
│   ├── prisma/schema.prisma SQLite schema (swap to Postgres for production)
│   ├── src/                 routes, controllers, middleware, sockets
│   └── uploads/             locally-stored menu/restaurant images
├── packages/
│   └── shared/               Shared across all 3 apps:
│       ├── types.ts          User, Restaurant, MenuItem, Order, etc.
│       ├── api.ts            Typed REST client
│       ├── socket.ts         Socket.IO client helpers
│       ├── theme.ts          Design tokens (colors, spacing, typography)
│       └── ui/               Button, Card, Header, Input, StatusPill, etc.
└── apps/
    ├── customer-app/         Browse, order, track (Expo/React Native)
    ├── restaurant-app/       Menu management, incoming orders (Expo/React Native)
    └── rider-app/            Accept deliveries, live GPS streaming (Expo/React Native)
```

**Backend**: Express + Prisma (SQLite for local dev) + Socket.IO. JWT auth (email/password), Multer for image uploads, Cash on Delivery or online payment via Razorpay.

**Real-time tracking**: the rider app streams GPS coordinates (`expo-location`) over a Socket.IO event; the backend broadcasts them to a room scoped to that order; the customer's order tracking screen joins that room and shows the rider moving on a map (`react-native-maps` on iOS/Android; a text-based fallback on web, since react-native-maps has no web renderer).

## Prerequisites

- **Node 22** — the apps use Expo SDK 54 / React Native 0.81, which require Node ≥20.19. If you use `nvm`, an `.nvmrc` is included at the repo root:
  ```
  nvm install
  nvm use
  ```
- **Expo Go** on your phone (App Store / Play Store) — no simulator needed. Expo Go only supports one SDK version at a time, so if you see "project is incompatible," update Expo Go to the latest version, or check its reported supported SDK and let us know if these apps need to target a different one.
- Alternatively, **Xcode** (iOS Simulator) and/or **Android Studio** (Android emulator) if you'd rather run outside of Expo Go.

## 1. Backend

```bash
cd backend
npm install
npx prisma migrate dev    # creates dev.db and applies the schema
npm run seed               # loads sample restaurant, menu, and test accounts
npm run dev                 # starts the API on http://localhost:4000
```

Health check: `curl http://localhost:4000/health` → `{"ok":true}`

### Seeded test accounts (password for all: `password123`)

| Role              | Email                      |
|-------------------|-----------------------------|
| Restaurant owner  | `owner@tastyhouse.test`    |
| Customer          | `customer@test.dev`         |
| Rider             | `rider@test.dev`            |

## 2. Install the apps

From the repo root (this installs and links `@restaurant-app/shared` into all three apps via npm workspaces):

```bash
npm install
```

## 3. Run an app

Each app is an independent Expo project. From its directory:

```bash
cd apps/customer-app      # or restaurant-app / rider-app
npx expo start
```

- Press `i` for iOS Simulator, `a` for Android emulator, or scan the QR code with **Expo Go** on your phone.
- `npx expo start --web` also works for quickly checking screens in a browser (auth, browsing, forms). Native-only features — the live map and GPS streaming — don't render on web; a data-only fallback is shown instead.

### Connecting to the backend from a physical device

The apps auto-detect the backend's address from the Expo dev server's own host (works out of the box for Expo Go on the same Wi-Fi network as your computer). To point at a different backend (e.g. a deployed one), set:

```bash
EXPO_PUBLIC_API_URL=http://your-backend-host:4000 npx expo start
```

## Typical demo flow

1. Log in to **restaurant-app** as `owner@tastyhouse.test` — menu items are pre-seeded ("Tasty House").
2. Log in to **customer-app** as `customer@test.dev`, browse to Tasty House, add items, and place an order — choose Cash on Delivery or Pay Online (requires Razorpay test keys, see Payments section below).
3. Back in **restaurant-app**, accept the order and advance it: Accepted → Preparing → Ready for pickup.
4. Log in to **rider-app** as `rider@test.dev`, accept the delivery, then Confirm pickup → Start delivering → Mark delivered.
5. While the rider is "on the way", open the order in **customer-app** — the tracking screen shows live status updates and (on a real device with location permission granted) the rider's position moving on the map.

## Pricing: delivery fee & discounts

Restaurant owners configure these from **restaurant-app → Profile → Edit restaurant details**:
- **Delivery fee** — a flat amount per order; set to 0 for free delivery.
- **Order discount (%)** — applied automatically to every order's subtotal.

Per-item discounts are set when adding/editing a menu item (**restaurant-app → Menu → Edit**): a discount percentage knocks down that item's price everywhere it's shown, with the original price struck through next to the discounted one. Both apply together — order total is computed as `(sum of per-item discounted prices) − (order discount %) + delivery fee`, and the exact breakdown is shown to the customer at checkout and in order details.

## Payments: Cash on Delivery & Razorpay

At checkout, customers pick **Cash on Delivery** or **Pay Online**. Online payment uses [Razorpay](https://razorpay.com)'s hosted checkout, opened inside a WebView (not the native Razorpay SDK, since that requires a custom dev build and won't run in Expo Go).

**To enable online payment**, add your own Razorpay **test-mode** API keys to `backend/.env`:
```
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
```
Get these from the Razorpay Dashboard → Settings → API Keys (make sure the dashboard is in **Test Mode**). Until these are set, "Pay Online" returns a clear error and Cash on Delivery still works normally.

**Flow**: placing an order with `paymentMethod: "RAZORPAY"` creates the order (unconfirmed) plus a matching Razorpay order, and returns the checkout details to the app, which opens Razorpay's checkout.js inside a WebView. On success, the app posts the payment ID/signature back to the backend, which verifies the HMAC signature server-side before marking the order paid. **The restaurant only sees the order, and only gets notified, once payment is verified** — an order that's never paid never reaches their incoming-orders list. If a customer backs out of payment, the order sits as "payment pending" and can be resumed from the order detail screen.

**Known limitation**: verification is client-driven (the app calls the verify endpoint after checkout succeeds) rather than via a Razorpay server-to-server webhook, since webhooks need a publicly reachable URL and this backend runs on localhost for local dev. Good enough for testing; add a webhook (e.g. via `ngrok` locally, or your real domain in production) for production-grade reliability against a dropped connection between payment success and the verify call.

## Notifications

Every app connects an authenticated Socket.IO channel at launch (`user:{userId}` room) that the backend pushes to for:
- **New order placed** → restaurant owner
- **Order status changes** (accepted, preparing, ready, picked up, on the way, delivered, cancelled) → the customer
- **Order ready for pickup** → all riders ("new delivery available")
- **Restaurant sets/changes a discount** → everyone who has previously ordered from that restaurant ("special offer")

Each triggers both an **in-app banner** (top-of-screen, auto-dismisses) and a **tab badge count** (cleared when that tab is opened) — these work immediately, in Expo Go, on both platforms, no extra setup.

They also attempt a **real Expo push notification** (the kind that shows up in the OS notification tray even when the app is closed), but that additionally requires:
1. Running `npx eas init` in each of the three `apps/*` directories (free, needs an Expo account) to get a project ID.
2. Android: a free Firebase project with an FCM service account key uploaded via `eas credentials`.
3. iOS: an Apple Developer Program membership ($99/year) for an APNs key, also via `eas credentials`.

Until that's done, push registration fails silently and only the in-app banners/badges fire — which is expected, not a bug. The code picks up real push automatically once the above is configured, no further changes needed. Also note: **remote push notifications don't work in Expo Go on Android** (Expo SDK 53+) — Android needs a development build regardless of the EAS setup above; iOS Expo Go still supports it.

## Known limitations (by design, for this MVP)

- **Payments**: Cash on Delivery and Razorpay (test mode) are supported; no server-to-server webhook (see Payments section above).
- **Auth**: email/password only — no phone/OTP.
- **Images**: stored on local disk under `backend/uploads`, served statically. Swap for S3/Cloudinary before deploying.
- **Database**: SQLite for zero-setup local dev. The Prisma schema has no SQLite-specific features, so switching `backend/prisma/schema.prisma`'s `datasource` to `postgresql` and updating `DATABASE_URL` is a one-line change for production.
- No ratings/reviews yet. Discounts are supported (see above) but there's no coupon-code system — discounts are restaurant-configured, not customer-entered.
- Rider "online/offline" is a UI-only toggle (not enforced by the backend) — it just controls whether the available-deliveries list is fetched.
