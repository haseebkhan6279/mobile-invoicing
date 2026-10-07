export const STOCK_STATUSES = ["IN_STOCK", "RESERVED", "SOLD", "RMA", "FAULTY"] as const;

export const PO_STATUSES = ["DRAFT", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"] as const;

export const INVOICE_STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "CANCELLED"] as const;

export const RMA_STATUSES = ["OPEN", "APPROVED", "RECEIVED", "REFUNDED", "CLOSED"] as const;

export const RMA_ACTIONS = ["RESTOCK", "CREDIT", "WRITE_OFF"] as const;

export const RMA_PAYMENT_TYPES = ["PENDING", "APPLIED_TO_INVOICE", "REFUNDED"] as const;

export const SHIPMENT_STATUSES = ["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED"] as const;

export const LEDGER_TYPES = ["CREDIT", "DEBIT"] as const;

export const INSTALLMENT_STATUSES = ["PENDING", "PAID"] as const;

export function labelStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * A YYYY-MM-DD picked in the UI, as the stored document date. Same day as
 * `current` keeps its exact timestamp (so ordering within the day survives);
 * a new day is stored at noon UTC so it prints as that day in UK/EU time.
 */
export function parseDocumentDate(value: string | null | undefined, current: Date): Date {
  const day = value?.trim().slice(0, 10);
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return current;
  if (current.toISOString().slice(0, 10) === day) return current;
  const date = new Date(`${day}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? current : date;
}
