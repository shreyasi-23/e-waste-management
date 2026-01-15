-- CreateTable Batch
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "location" TEXT NOT NULL DEFAULT 'USA',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Batch_externalId_key" UNIQUE ("externalId")
);

-- CreateTable ImageAsset
CREATE TABLE "ImageAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImageAsset_s3Key_key" UNIQUE ("s3Key"),
    CONSTRAINT "ImageAsset_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable DetectionResult
CREATE TABLE "DetectionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageAssetId" TEXT NOT NULL,
    "rawBoxes" JSONB NOT NULL,
    "summaryLabels" JSONB NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetectionResult_imageAssetId_key" UNIQUE ("imageAssetId"),
    CONSTRAINT "DetectionResult_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "ImageAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable TextInventoryEntry
CREATE TABLE "TextInventoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TextInventoryEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable InventoryNormalized
CREATE TABLE "InventoryNormalized" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "rawLabel" TEXT NOT NULL,
    "normalizedType" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "normalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryNormalized_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable MetalEstimate
CREATE TABLE "MetalEstimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "composition" JSONB NOT NULL,
    "aggregateTotalsKg" JSONB NOT NULL,
    "uncertainty" JSONB NOT NULL,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promptHash" TEXT,
    "modelUsed" TEXT,
    CONSTRAINT "MetalEstimate_batchId_key" UNIQUE ("batchId"),
    CONSTRAINT "MetalEstimate_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable PriceSnapshot
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "timestampUtc" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricesPerKg" JSONB NOT NULL,
    "totalGrossValueUsd" REAL NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promptHash" TEXT,
    "modelUsed" TEXT,
    CONSTRAINT "PriceSnapshot_batchId_key" UNIQUE ("batchId"),
    CONSTRAINT "PriceSnapshot_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable ExtractionPlan
CREATE TABLE "ExtractionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "recommendedProcesses" JSONB NOT NULL,
    "totalCostUsd" REAL NOT NULL,
    "capexUsd" REAL NOT NULL,
    "opexUsd" REAL NOT NULL,
    "logisticsCostUsd" REAL NOT NULL,
    "timeline" JSONB NOT NULL,
    "risks" JSONB NOT NULL DEFAULT '[]',
    "sensitivity" JSONB NOT NULL,
    "netProfitUsd" REAL NOT NULL,
    "citations" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promptHash" TEXT,
    "modelUsed" TEXT,
    CONSTRAINT "ExtractionPlan_batchId_key" UNIQUE ("batchId"),
    CONSTRAINT "ExtractionPlan_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable InvestorReport
CREATE TABLE "InvestorReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "reportJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestorReport_batchId_key" UNIQUE ("batchId"),
    CONSTRAINT "InvestorReport_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable PipelineRun
CREATE TABLE "PipelineRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stepResults" JSONB NOT NULL DEFAULT '{}',
    "errors" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "modelVersions" JSONB NOT NULL,
    CONSTRAINT "PipelineRun_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Batch_createdAt_idx" ON "Batch"("createdAt");

-- CreateIndex
CREATE INDEX "Batch_location_idx" ON "Batch"("location");

-- CreateIndex
CREATE INDEX "ImageAsset_batchId_idx" ON "ImageAsset"("batchId");

-- CreateIndex
CREATE INDEX "DetectionResult_imageAssetId_idx" ON "DetectionResult"("imageAssetId");

-- CreateIndex
CREATE INDEX "TextInventoryEntry_batchId_idx" ON "TextInventoryEntry"("batchId");

-- CreateIndex
CREATE INDEX "InventoryNormalized_batchId_idx" ON "InventoryNormalized"("batchId");

-- CreateIndex
CREATE INDEX "InventoryNormalized_normalizedType_idx" ON "InventoryNormalized"("normalizedType");

-- CreateIndex
CREATE INDEX "MetalEstimate_batchId_idx" ON "MetalEstimate"("batchId");

-- CreateIndex
CREATE INDEX "PriceSnapshot_batchId_idx" ON "PriceSnapshot"("batchId");

-- CreateIndex
CREATE INDEX "ExtractionPlan_batchId_idx" ON "ExtractionPlan"("batchId");

-- CreateIndex
CREATE INDEX "InvestorReport_batchId_idx" ON "InvestorReport"("batchId");

-- CreateIndex
CREATE INDEX "PipelineRun_batchId_idx" ON "PipelineRun"("batchId");

-- CreateIndex
CREATE INDEX "PipelineRun_currentStep_idx" ON "PipelineRun"("currentStep");

-- CreateIndex
CREATE INDEX "PipelineRun_status_idx" ON "PipelineRun"("status");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
