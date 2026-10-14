-- Files attached to an invoice or an RMA. Deleting the invoice/RMA deletes them.
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "rmaId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Attachment_invoiceId_idx" ON "Attachment"("invoiceId");
CREATE INDEX "Attachment_rmaId_idx" ON "Attachment"("rmaId");

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_rmaId_fkey" FOREIGN KEY ("rmaId") REFERENCES "Rma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
