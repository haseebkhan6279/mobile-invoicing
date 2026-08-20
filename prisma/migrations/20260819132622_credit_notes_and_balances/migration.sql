-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "shippingAddress" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paidAmountEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmountGbp" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentTerms" TEXT DEFAULT 'Immediate',
ADD COLUMN     "shippingLabel" TEXT,
ADD COLUMN     "warrantyTerms" TEXT DEFAULT '3 months';

-- AlterTable
ALTER TABLE "Rma" ADD COLUMN     "appliedInvoiceId" TEXT,
ADD COLUMN     "paymentAmountEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentAmountGbp" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "paymentType" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "RmaItem" ADD COLUMN     "reason" TEXT,
ADD COLUMN     "unitPriceEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "unitPriceGbp" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Rma" ADD CONSTRAINT "Rma_appliedInvoiceId_fkey" FOREIGN KEY ("appliedInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
