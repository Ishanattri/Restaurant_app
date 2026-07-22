-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "riderId" TEXT,
    "deliveryAddressId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "subtotal" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "deliveryFee" REAL NOT NULL DEFAULT 25,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "deliveryAddressId", "deliveryFee", "discountAmount", "id", "paymentMethod", "restaurantId", "riderId", "status", "subtotal", "total", "updatedAt") SELECT "createdAt", "customerId", "deliveryAddressId", "deliveryFee", "discountAmount", "id", "paymentMethod", "restaurantId", "riderId", "status", "subtotal", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
