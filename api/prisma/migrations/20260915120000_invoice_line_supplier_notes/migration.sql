-- AlterTable
ALTER TABLE "InvoiceLine" ADD COLUMN     "supplierNote" TEXT,
ADD COLUMN     "imeiNotes" JSONB NOT NULL DEFAULT '{}';
