-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "browserLang" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "eventData" JSON,
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "screenHeight" INTEGER,
ADD COLUMN     "screenWidth" INTEGER,
ADD COLUMN     "scrollDepth" INTEGER,
ADD COLUMN     "timeOnPage" INTEGER,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "onSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "saleDiscountType" TEXT NOT NULL DEFAULT 'percentage',
ADD COLUMN     "salePercent" DECIMAL(5,2),
ADD COLUMN     "saleUntil" TIMESTAMP(6);

-- CreateTable
CREATE TABLE "SupportStatus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedIp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "BlockedIp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductView" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "sessionCartId" TEXT NOT NULL,
    "userId" UUID,
    "ip" TEXT,
    "country" TEXT,
    "duration" INTEGER,
    "variantViewed" TEXT,
    "fromPage" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionCartId" TEXT NOT NULL,
    "userId" UUID,
    "eventType" TEXT NOT NULL,
    "productId" UUID,
    "variantId" UUID,
    "quantity" INTEGER,
    "price" DECIMAL(12,2),
    "ip" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionCartId" TEXT NOT NULL,
    "userId" UUID,
    "query" TEXT NOT NULL,
    "resultsCount" INTEGER,
    "clickedResult" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventType" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "email" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "details" JSON,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_ip_key" ON "BlockedIp"("ip");

-- CreateIndex
CREATE INDEX "ProductView_productId_idx" ON "ProductView"("productId");

-- CreateIndex
CREATE INDEX "ProductView_sessionCartId_idx" ON "ProductView"("sessionCartId");

-- CreateIndex
CREATE INDEX "ProductView_userId_idx" ON "ProductView"("userId");

-- CreateIndex
CREATE INDEX "ProductView_createdAt_idx" ON "ProductView"("createdAt");

-- CreateIndex
CREATE INDEX "CartEvent_sessionCartId_idx" ON "CartEvent"("sessionCartId");

-- CreateIndex
CREATE INDEX "CartEvent_userId_idx" ON "CartEvent"("userId");

-- CreateIndex
CREATE INDEX "CartEvent_eventType_idx" ON "CartEvent"("eventType");

-- CreateIndex
CREATE INDEX "CartEvent_productId_idx" ON "CartEvent"("productId");

-- CreateIndex
CREATE INDEX "CartEvent_createdAt_idx" ON "CartEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_sessionCartId_idx" ON "SearchQuery"("sessionCartId");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_idx" ON "SearchQuery"("userId");

-- CreateIndex
CREATE INDEX "SearchQuery_query_idx" ON "SearchQuery"("query");

-- CreateIndex
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_ip_idx" ON "SecurityEvent"("ip");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_ip_idx" ON "AnalyticsEvent"("ip");
