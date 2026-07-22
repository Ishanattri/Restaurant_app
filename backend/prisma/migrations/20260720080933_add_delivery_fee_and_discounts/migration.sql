-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isVeg" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MenuItem" ("category", "createdAt", "description", "id", "imageUrl", "isAvailable", "isVeg", "name", "price", "restaurantId") SELECT "category", "createdAt", "description", "id", "imageUrl", "isAvailable", "isVeg", "name", "price", "restaurantId" FROM "MenuItem";
DROP TABLE "MenuItem";
ALTER TABLE "new_MenuItem" RENAME TO "MenuItem";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "RiderProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "deliveryAddressId", "deliveryFee", "id", "paymentMethod", "restaurantId", "riderId", "status", "subtotal", "total", "updatedAt") SELECT "createdAt", "customerId", "deliveryAddressId", "deliveryFee", "id", "paymentMethod", "restaurantId", "riderId", "status", "subtotal", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cuisine" TEXT,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "imageUrl" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "rating" REAL NOT NULL DEFAULT 4.2,
    "deliveryFee" REAL NOT NULL DEFAULT 25,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Restaurant" ("address", "createdAt", "cuisine", "description", "id", "imageUrl", "isOpen", "lat", "lng", "name", "ownerId", "rating") SELECT "address", "createdAt", "cuisine", "description", "id", "imageUrl", "isOpen", "lat", "lng", "name", "ownerId", "rating" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE UNIQUE INDEX "Restaurant_ownerId_key" ON "Restaurant"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
