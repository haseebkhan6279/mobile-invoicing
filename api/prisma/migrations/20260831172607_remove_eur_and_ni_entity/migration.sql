-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "entity",
DROP COLUMN "fxRate",
DROP COLUMN "paidAmountEur",
DROP COLUMN "shippingCostEur";

-- AlterTable
ALTER TABLE "InvoiceLine" DROP COLUMN "buyPriceEur",
DROP COLUMN "unitPriceEur";

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "actualCostEur",
DROP COLUMN "fxRate",
DROP COLUMN "shippingCostEur";

-- AlterTable
ALTER TABLE "PurchaseOrderLine" DROP COLUMN "unitCostEur";

-- AlterTable
ALTER TABLE "Rma" DROP COLUMN "paymentAmountEur";

-- AlterTable
ALTER TABLE "RmaItem" DROP COLUMN "unitPriceEur";

-- AlterTable
ALTER TABLE "Shipment" DROP COLUMN "actualCostEur",
DROP COLUMN "shippingCostEur";

-- AlterTable
ALTER TABLE "StockUnit" DROP COLUMN "costEur";

-- AlterTable
ALTER TABLE "SupplierLedger" DROP COLUMN "amountEur";

