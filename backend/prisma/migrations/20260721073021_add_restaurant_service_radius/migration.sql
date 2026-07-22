-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cuisine" TEXT,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "imageUrl" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "rating" REAL NOT NULL DEFAULT 4.2,
    "deliveryFee" REAL NOT NULL DEFAULT 25,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "serviceRadiusKm" REAL NOT NULL DEFAULT 7,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Restaurant" ("address", "createdAt", "cuisine", "deliveryFee", "description", "discountPercent", "id", "imageUrl", "isOpen", "lat", "lng", "name", "ownerId", "phone", "rating") SELECT "address", "createdAt", "cuisine", "deliveryFee", "description", "discountPercent", "id", "imageUrl", "isOpen", "lat", "lng", "name", "ownerId", "phone", "rating" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE UNIQUE INDEX "Restaurant_ownerId_key" ON "Restaurant"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
