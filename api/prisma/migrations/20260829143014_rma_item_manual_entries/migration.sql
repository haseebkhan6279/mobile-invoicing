-- DropForeignKey
ALTER TABLE "RmaItem" DROP CONSTRAINT "RmaItem_stockUnitId_fkey";

-- AlterTable
ALTER TABLE "RmaItem" ADD COLUMN     "color" TEXT,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "imei" TEXT,
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "productName" TEXT,
ALTER COLUMN "stockUnitId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RmaItem" ADD CONSTRAINT "RmaItem_stockUnitId_fkey" FOREIGN KEY ("stockUnitId") REFERENCES "StockUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
