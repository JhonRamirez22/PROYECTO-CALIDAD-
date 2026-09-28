-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GERENTE', 'OPERADOR', 'CONTADOR', 'PROPIETARIO', 'COMPRADOR', 'VENDEDOR', 'LOGISTICA', 'CLIENTE_PERSONAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'PAYMENT');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CAFE', 'CACAO');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('DISPONIBLE', 'RESERVADO', 'ENVIADO', 'CERTIFICADO');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "ClientContractStatus" AS ENUM ('BORRADOR', 'ACTIVO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('BORRADOR', 'PENDIENTE_APROBACION', 'CONFIRMADO', 'RECHAZADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO', 'PAGADO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('FOB', 'CFR', 'CIF', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DDP', 'DPU');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'USD', 'COP');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('ORGANICO', 'FAIR_TRADE', 'RAINFOREST_ALLIANCE', 'ORIGEN', 'FITOSANITARIO', 'EUDR', 'CALIDAD', 'ORIGIN_CERTIFICATION', 'FINCA_ORGANICO', 'FINCA_FAIR_TRADE', 'FINCA_RAINFOREST', 'FINCA_EUDR', 'FINCA_SOSTENIBILIDAD', 'FINCA_CAPACIDAD');

-- CreateEnum
CREATE TYPE "SampleVerificationStatus" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "DeforestationStatus" AS ENUM ('CERTIFICADO_LIBRE', 'EN_EVALUACION', 'NO_CERTIFICADO');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDIENTE', 'PAGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "LogisticsStatus" AS ENUM ('REGISTRADO', 'EN_TRANSITO', 'EN_ADUANA', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PROFORMA', 'COMMERCIAL', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');

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
CREATE TYPE "DocumentType" AS ENUM ('ORIGEN', 'FITOSANITARIO', 'EUDR', 'CALIDAD', 'COMERCIAL', 'PACKING_LIST');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('BORRADOR', 'GENERADO', 'VALIDADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS_CHANGE', 'DOCUMENT_UPLOAD', 'CERTIFICATE_EXPIRY', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" "UserRole"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "module" TEXT NOT NULL,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canUpdate" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" "AuditAction" NOT NULL,
    "module" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "variety" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "altitude" TEXT,
    "process" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "traceabilityCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ownedById" TEXT,
    "weight" DECIMAL(10,2) NOT NULL,
    "harvestDate" TIMESTAMP(3),
    "processDate" TIMESTAMP(3),
    "originLocation" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "notes" TEXT,
    "exportPrice" DECIMAL(10,2),
    "currency" "Currency" DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "company" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "vatId" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'compras',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContract" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "status" "ClientContractStatus" NOT NULL DEFAULT 'BORRADOR',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sellerId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'BORRADOR',
    "incoterm" "Incoterm" NOT NULL DEFAULT 'FOB',
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "totalAmount" DECIMAL(12,2),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotId" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "packageCount" INTEGER,
    "grossWeight" DECIMAL(10,2),
    "dimensions" TEXT,
    "marks" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "lotId" TEXT,
    "shipmentId" TEXT,
    "type" "CertificateType" NOT NULL,
    "number" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "documentFormat" TEXT,
    "countryOfOrigin" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityAnalysis" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "analyst" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fragrance" INTEGER NOT NULL,
    "flavor" INTEGER NOT NULL,
    "aftertaste" INTEGER NOT NULL,
    "acidity" INTEGER NOT NULL,
    "body" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "uniformity" INTEGER NOT NULL,
    "sweetness" INTEGER NOT NULL,
    "cleanCup" INTEGER NOT NULL,
    "overall" INTEGER NOT NULL,
    "totalScore" DECIMAL(5,2) NOT NULL,
    "defects" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualitySampleVerification" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "verifierId" TEXT,
    "status" "SampleVerificationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "samplePhoto" TEXT,
    "sampleNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "ownerSamplePhoto" TEXT,
    "ownerSampleNotes" TEXT,
    "verifierSamplePhoto" TEXT,
    "verifierSampleNotes" TEXT,
    "matches" BOOLEAN,
    "matchTolerancePoints" INTEGER NOT NULL DEFAULT 2,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualitySampleVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmName" TEXT NOT NULL,
    "farmLocation" TEXT NOT NULL,
    "productionCapacity" DECIMAL(10,2) NOT NULL,
    "coffeeType" TEXT,
    "coffeeVariety" TEXT,
    "qualityGrade" TEXT,
    "deforestationStatus" "DeforestationStatus" NOT NULL DEFAULT 'EN_EVALUACION',
    "deforestationProof" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "commissionRate" DECIMAL(5,4),
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmCertificate" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "number" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsEntry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "LogisticsStatus" NOT NULL DEFAULT 'REGISTRADO',
    "transporter" TEXT,
    "trackingNumber" TEXT,
    "originPort" TEXT,
    "destPort" TEXT,
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDIENTE',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "dueDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

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
    "certificateFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
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
    "shipmentId" TEXT,
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_role_module_key" ON "Permission"("role", "module");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_variety_origin_key" ON "Product"("variety", "origin");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_traceabilityCode_key" ON "Lot"("traceabilityCode");

-- CreateIndex
CREATE INDEX "Lot_productId_idx" ON "Lot"("productId");

-- CreateIndex
CREATE INDEX "Lot_status_idx" ON "Lot"("status");

-- CreateIndex
CREATE INDEX "Lot_ownedById_idx" ON "Lot"("ownedById");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_vatId_key" ON "Client"("vatId");

-- CreateIndex
CREATE INDEX "Client_country_idx" ON "Client"("country");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientContract_contractNumber_key" ON "ClientContract"("contractNumber");

-- CreateIndex
CREATE INDEX "ClientContract_clientId_idx" ON "ClientContract"("clientId");

-- CreateIndex
CREATE INDEX "ClientContract_status_idx" ON "ClientContract"("status");

-- CreateIndex
CREATE INDEX "ClientContract_endDate_idx" ON "ClientContract"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");

-- CreateIndex
CREATE INDEX "Order_sellerId_idx" ON "Order"("sellerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Certificate_productId_idx" ON "Certificate"("productId");

-- CreateIndex
CREATE INDEX "Certificate_lotId_idx" ON "Certificate"("lotId");

-- CreateIndex
CREATE INDEX "Certificate_shipmentId_idx" ON "Certificate"("shipmentId");

-- CreateIndex
CREATE INDEX "Certificate_type_idx" ON "Certificate"("type");

-- CreateIndex
CREATE INDEX "QualityAnalysis_lotId_idx" ON "QualityAnalysis"("lotId");

-- CreateIndex
CREATE INDEX "QualityAnalysis_totalScore_idx" ON "QualityAnalysis"("totalScore");

-- CreateIndex
CREATE UNIQUE INDEX "QualitySampleVerification_lotId_key" ON "QualitySampleVerification"("lotId");

-- CreateIndex
CREATE INDEX "QualitySampleVerification_lotId_idx" ON "QualitySampleVerification"("lotId");

-- CreateIndex
CREATE INDEX "QualitySampleVerification_verifierId_idx" ON "QualitySampleVerification"("verifierId");

-- CreateIndex
CREATE INDEX "QualitySampleVerification_status_idx" ON "QualitySampleVerification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE INDEX "SellerProfile_userId_idx" ON "SellerProfile"("userId");

-- CreateIndex
CREATE INDEX "FarmCertificate_sellerProfileId_idx" ON "FarmCertificate"("sellerProfileId");

-- CreateIndex
CREATE INDEX "FarmCertificate_type_idx" ON "FarmCertificate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_orderId_key" ON "Commission"("orderId");

-- CreateIndex
CREATE INDEX "Commission_orderId_idx" ON "Commission"("orderId");

-- CreateIndex
CREATE INDEX "Commission_sellerId_idx" ON "Commission"("sellerId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsEntry_orderId_key" ON "LogisticsEntry"("orderId");

-- CreateIndex
CREATE INDEX "LogisticsEntry_orderId_idx" ON "LogisticsEntry"("orderId");

-- CreateIndex
CREATE INDEX "LogisticsEntry_status_idx" ON "LogisticsEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

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
CREATE INDEX "Document_shipmentId_idx" ON "Document"("shipmentId");

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

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_ownedById_fkey" FOREIGN KEY ("ownedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientContract" ADD CONSTRAINT "ClientContract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAnalysis" ADD CONSTRAINT "QualityAnalysis_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitySampleVerification" ADD CONSTRAINT "QualitySampleVerification_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitySampleVerification" ADD CONSTRAINT "QualitySampleVerification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmCertificate" ADD CONSTRAINT "FarmCertificate_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsEntry" ADD CONSTRAINT "LogisticsEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Document" ADD CONSTRAINT "Document_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
