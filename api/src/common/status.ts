export const STOCK_STATUSES = ["IN_STOCK", "RESERVED", "SOLD", "RMA", "FAULTY"] as const;

export const PO_STATUSES = ["DRAFT", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"] as const;

export const INVOICE_STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "CANCELLED"] as const;

export const RMA_STATUSES = ["OPEN", "APPROVED", "RECEIVED", "REFUNDED", "CLOSED"] as const;

export const RMA_ACTIONS = ["RESTOCK", "CREDIT", "WRITE_OFF"] as const;

export const RMA_PAYMENT_TYPES = ["PENDING", "APPLIED_TO_INVOICE", "REFUNDED"] as const;

export const SHIPMENT_STATUSES = ["PREPARING", "SHIPPED", "IN_TRANSIT", "DELIVERED"] as const;

export const LEDGER_TYPES = ["CREDIT", "DEBIT"] as const;
