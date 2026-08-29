-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "attachmentData" BYTEA,
ADD COLUMN     "attachmentFilename" TEXT,
ADD COLUMN     "attachmentMimeType" TEXT;
