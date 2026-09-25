-- Letterhead and bank are independent of print currency so Atlantic can issue
-- GBP invoices (and Echo EUR) and still pick the matching bank block.
ALTER TABLE "Invoice" ADD COLUMN "issuingEntity" TEXT NOT NULL DEFAULT 'ECHO';
ALTER TABLE "Invoice" ADD COLUMN "bankAccount" TEXT NOT NULL DEFAULT 'GBP';

UPDATE "Invoice"
SET "issuingEntity" = 'ATLANTIC', "bankAccount" = 'EUR'
WHERE "printCurrency" = 'EUR';
