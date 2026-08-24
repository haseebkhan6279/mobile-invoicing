-- AlterTable
ALTER TABLE "InvoiceLine" ADD COLUMN     "imeis" TEXT[] DEFAULT ARRAY[]::TEXT[];
