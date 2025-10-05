-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" TEXT NOT NULL,
    "rowsParsed" INTEGER NOT NULL,
    "country" TEXT,
    "erp" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'csv',

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "uploadId" TEXT NOT NULL,
    "reportJson" JSONB NOT NULL,
    "scoresOverall" INTEGER NOT NULL,
    "country" TEXT,
    "erp" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_mappings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadId" TEXT NOT NULL,
    "reportId" TEXT,
    "sourceField" TEXT NOT NULL,
    "targetField" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "matchType" TEXT NOT NULL,

    CONSTRAINT "field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadId" TEXT NOT NULL,
    "reportId" TEXT,
    "questionnaire" JSONB NOT NULL,
    "processingTime" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "analysis_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
