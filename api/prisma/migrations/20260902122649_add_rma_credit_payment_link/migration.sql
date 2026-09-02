-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "rmaId" TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rmaId_fkey" FOREIGN KEY ("rmaId") REFERENCES "Rma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
