-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('TRANSPORTISTA', 'ASEGURADORA', 'TRANSITARIO');

-- CreateEnum
CREATE TYPE "ContainerType" AS ENUM ('REFRIGERADO_20', 'REFRIGERADO_40', 'ESTANDAR_20', 'ESTANDAR_40', 'HC_40', 'GRANELERO');

-- CreateEnum
CREATE TYPE "ShipmentMode" AS ENUM ('FTL', 'LCL');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('BORRADOR', 'CONSOLIDADO', 'CONFIRMADO', 'EN_TRANSITO', 'EN_ADUANA', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "CustomsDocType" AS ENUM ('DUA', 'SAD');

-- CreateEnum
CREATE TYPE "CustomsDocStatus" AS ENUM ('BORRADOR', 'GENERADO', 'PRESENTADO', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EUDRDocStatus" AS ENUM ('BORRADOR', 'GENERADO', 'VALIDADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ORIGEN', 'FITOSANITARIO', 'EUDR', 'CALIDAD', 'COMERCIAL');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('BORRADOR', 'GENERADO', 'VALIDADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS_CHANGE', 'DOCUMENT_UPLOAD', 'CERTIFICATE_EXPIRY', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- AlterEnum
ALTER TYPE "CertificateType" ADD VALUE 'ORIGIN_CERTIFICATION';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CLIENTE_PERSONAL';

-- AlterTable
ALTER TABLE "QualitySampleVerification" ADD COLUMN     "matchTolerancePoints" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "matches" BOOLEAN,
ADD COLUMN     "ownerSampleNotes" TEXT,
ADD COLUMN     "ownerSamplePhoto" TEXT,
ADD COLUMN     "verifiedById" TEXT,
ADD COLUMN     "verifierSampleNotes" TEXT,
ADD COLUMN     "verifierSamplePhoto" TEXT;

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "commissionRate" DECIMAL(5,4),
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "taxId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "policyNumber" TEXT,
    "policyExpiry" TIMESTAMP(3),
    "insuredAmount" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingDestination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "portCode" TEXT,
    "address" TEXT,
    "requiresTempControl" BOOLEAN NOT NULL DEFAULT false,
    "tempMinC" INTEGER,
    "tempMaxC" INTEGER,
    "defaultContainer" "ContainerType" NOT NULL DEFAULT 'ESTANDAR_20',
    "defaultMode" "ShipmentMode" NOT NULL DEFAULT 'FTL',
    "incotermDefault" "Incoterm" NOT NULL DEFAULT 'FOB',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'BORRADOR',
    "destinationId" TEXT NOT NULL,
    "providerId" TEXT,
    "containerType" "ContainerType" NOT NULL DEFAULT 'ESTANDAR_20',
    "containerNumber" TEXT,
    "mode" "ShipmentMode" NOT NULL DEFAULT 'FTL',
    "needsTempControl" BOOLEAN NOT NULL DEFAULT false,
    "tempMinC" INTEGER,
    "tempMaxC" INTEGER,
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3),
    "insurancePolicy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentOrder" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingConfirmation" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "bookingNumber" TEXT,
    "providerId" TEXT,
    "containerNumber" TEXT,
    "eta" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDIENTE',
    "trackingUrl" TEXT,
    "emotionalNote" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomsDocument" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "type" "CustomsDocType" NOT NULL,
    "documentNumber" TEXT,
    "status" "CustomsDocStatus" NOT NULL DEFAULT 'BORRADOR',
    "exporterInfo" JSONB,
    "importerInfo" JSONB,
    "goodsInfo" JSONB,
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EUDRDocument" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "lotId" TEXT,
    "status" "EUDRDocStatus" NOT NULL DEFAULT 'BORRADOR',
    "gpsLatitude" DECIMAL(10,7),
    "gpsLongitude" DECIMAL(10,7),
    "harvestDate" TIMESTAMP(3),
    "deforestationEvidence" TEXT,
    "declarationText" TEXT,
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EUDRDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "number" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'BORRADOR',
    "issuedBy" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderStatusEmail" BOOLEAN NOT NULL DEFAULT true,
    "orderStatusInApp" BOOLEAN NOT NULL DEFAULT true,
    "documentUploadEmail" BOOLEAN NOT NULL DEFAULT true,
    "documentUploadInApp" BOOLEAN NOT NULL DEFAULT true,
    "certificateExpiryEmail" BOOLEAN NOT NULL DEFAULT true,
    "certificateExpiryInApp" BOOLEAN NOT NULL DEFAULT true,
    "systemAlertEmail" BOOLEAN NOT NULL DEFAULT true,
    "systemAlertInApp" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "NotificationFrequency" NOT NULL DEFAULT 'INSTANT',
    "additionalRecipients" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartItem_sessionId_idx" ON "CartItem"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_sessionId_productId_lotId_key" ON "CartItem"("sessionId", "productId", "lotId");

-- CreateIndex
CREATE INDEX "LogisticsProvider_type_idx" ON "LogisticsProvider"("type");

-- CreateIndex
CREATE INDEX "LogisticsProvider_active_idx" ON "LogisticsProvider"("active");

-- CreateIndex
CREATE INDEX "ShippingDestination_country_idx" ON "ShippingDestination"("country");

-- CreateIndex
CREATE INDEX "ShippingDestination_active_idx" ON "ShippingDestination"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_destinationId_idx" ON "Shipment"("destinationId");

-- CreateIndex
CREATE INDEX "Shipment_providerId_idx" ON "Shipment"("providerId");

-- CreateIndex
CREATE INDEX "ShipmentOrder_shipmentId_idx" ON "ShipmentOrder"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentOrder_orderId_idx" ON "ShipmentOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentOrder_shipmentId_orderId_key" ON "ShipmentOrder"("shipmentId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingConfirmation_shipmentId_key" ON "BookingConfirmation"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingConfirmation_bookingNumber_key" ON "BookingConfirmation"("bookingNumber");

-- CreateIndex
CREATE INDEX "BookingConfirmation_shipmentId_idx" ON "BookingConfirmation"("shipmentId");

-- CreateIndex
CREATE INDEX "BookingConfirmation_status_idx" ON "BookingConfirmation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CustomsDocument_documentNumber_key" ON "CustomsDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "CustomsDocument_shipmentId_idx" ON "CustomsDocument"("shipmentId");

-- CreateIndex
CREATE INDEX "CustomsDocument_type_idx" ON "CustomsDocument"("type");

-- CreateIndex
CREATE INDEX "CustomsDocument_status_idx" ON "CustomsDocument"("status");

-- CreateIndex
CREATE INDEX "EUDRDocument_shipmentId_idx" ON "EUDRDocument"("shipmentId");

-- CreateIndex
CREATE INDEX "EUDRDocument_lotId_idx" ON "EUDRDocument"("lotId");

-- CreateIndex
CREATE INDEX "EUDRDocument_status_idx" ON "EUDRDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Document_number_key" ON "Document"("number");

-- CreateIndex
CREATE INDEX "Document_orderId_idx" ON "Document"("orderId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QualitySampleVerification_lotId_key" ON "QualitySampleVerification"("lotId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "ShippingDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "LogisticsProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentOrder" ADD CONSTRAINT "ShipmentOrder_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentOrder" ADD CONSTRAINT "ShipmentOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingConfirmation" ADD CONSTRAINT "BookingConfirmation_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingConfirmation" ADD CONSTRAINT "BookingConfirmation_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "ShippingDestination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingConfirmation" ADD CONSTRAINT "BookingConfirmation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "LogisticsProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomsDocument" ADD CONSTRAINT "CustomsDocument_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EUDRDocument" ADD CONSTRAINT "EUDRDocument_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EUDRDocument" ADD CONSTRAINT "EUDRDocument_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

