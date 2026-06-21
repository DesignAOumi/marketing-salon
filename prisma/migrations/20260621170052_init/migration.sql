-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameKana" TEXT,
    "birthday" DATETIME,
    "gender" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'new',
    "preferredStaffId" TEXT,
    "consentToContact" BOOLEAN NOT NULL DEFAULT false,
    "consentUpdatedAt" DATETIME,
    "consentObtainedAt" DATETIME,
    "consentChannel" TEXT,
    "hairType" TEXT,
    "skinType" TEXT,
    "allergies" TEXT,
    "preferences" TEXT,
    "notes" TEXT,
    "firstVisitDate" DATETIME,
    "lastVisitDate" DATETIME,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "avgVisitIntervalDays" REAL,
    "nextPredictedVisitDate" DATETIME,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "lastSaleAmount" INTEGER,
    "retailPurchaseCount" INTEGER NOT NULL DEFAULT 0,
    "rfmSegment" TEXT,
    "anniversaryDate" DATETIME,
    "lastContactDate" DATETIME,
    "reviewGiven" BOOLEAN NOT NULL DEFAULT false,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Customer_preferredStaffId_fkey" FOREIGN KEY ("preferredStaffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "staffId" TEXT,
    "menu" TEXT,
    "serviceId" TEXT,
    "products" TEXT,
    "memo" TEXT,
    "saleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Visit_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Visit_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Visit_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" INTEGER NOT NULL,
    "durationMin" INTEGER,
    "defaultCycleDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER,
    "paymentMethod" TEXT,
    "staffId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "serviceId" TEXT,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "lineDiscount" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" INTEGER NOT NULL,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "serviceId" TEXT,
    "staffId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "googleEventId" TEXT,
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdviceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "mode" TEXT NOT NULL,
    "adviceKey" TEXT,
    "triggerSnapshot" TEXT,
    "message" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'shown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdviceLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "salonName" TEXT NOT NULL,
    "salonPhone" TEXT,
    "salonEmail" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "currency" TEXT NOT NULL DEFAULT 'JPY',
    "aiMode" TEXT NOT NULL DEFAULT 'offline',
    "aiProvider" TEXT NOT NULL DEFAULT 'claude',
    "aiModel" TEXT,
    "encryptedApiKey" TEXT,
    "apiKeyIv" TEXT,
    "aiSharedFields" TEXT,
    "anonymizeBeforeSend" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionYears" INTEGER NOT NULL DEFAULT 3,
    "sessionIdleTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_lastVisitDate_idx" ON "Customer"("lastVisitDate");

-- CreateIndex
CREATE INDEX "Customer_nextPredictedVisitDate_idx" ON "Customer"("nextPredictedVisitDate");

-- CreateIndex
CREATE INDEX "Customer_rfmSegment_idx" ON "Customer"("rfmSegment");

-- CreateIndex
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_saleId_key" ON "Visit"("saleId");

-- CreateIndex
CREATE INDEX "Visit_customerId_date_idx" ON "Visit"("customerId", "date");

-- CreateIndex
CREATE INDEX "Visit_date_idx" ON "Visit"("date");

-- CreateIndex
CREATE INDEX "Sale_customerId_date_idx" ON "Sale"("customerId", "date");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_itemType_idx" ON "SaleItem"("itemType");

-- CreateIndex
CREATE INDEX "Reservation_customerId_startAt_idx" ON "Reservation"("customerId", "startAt");

-- CreateIndex
CREATE INDEX "Reservation_startAt_status_idx" ON "Reservation"("startAt", "status");

-- CreateIndex
CREATE INDEX "AdviceLog_customerId_idx" ON "AdviceLog"("customerId");

-- CreateIndex
CREATE INDEX "AdviceLog_createdAt_idx" ON "AdviceLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");
