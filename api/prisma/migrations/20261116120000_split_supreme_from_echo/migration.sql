-- Supreme Retail becomes its own entity instead of a rename of ECHO, so
-- invoices issued as Echo Logic keep printing as Echo Logic.
ALTER TABLE "Invoice" ALTER COLUMN "issuingEntity" SET DEFAULT 'SUPREME';
ALTER TABLE "Invoice" ALTER COLUMN "bankAccount" SET DEFAULT 'SUPREME';

-- ECHO invoices created after the rename shipped (commit a87f671,
-- 2026-11-13 09:36 UTC) were issued as Supreme Retail.
UPDATE "Invoice"
SET "issuingEntity" = 'SUPREME'
WHERE "issuingEntity" = 'ECHO' AND "createdAt" >= '2026-11-13 09:36:21+00';

UPDATE "Invoice"
SET "bankAccount" = 'SUPREME'
WHERE "bankAccount" = 'GBP' AND "createdAt" >= '2026-11-13 09:36:21+00';
