import { Badge } from "@/components/ui/badge";
import { labelStatus } from "@/lib/status";

const toneMap: Record<string, "slate" | "blue" | "green" | "amber" | "red" | "violet"> = {
  IN_STOCK: "green",
  RESERVED: "amber",
  SOLD: "blue",
  RMA: "violet",
  FAULTY: "red",
  DRAFT: "slate",
  ORDERED: "blue",
  PARTIAL: "amber",
  RECEIVED: "green",
  CANCELLED: "red",
  PENDING: "amber",
  AWAITING_PAYMENT: "violet",
  PAID: "green",
  OPEN: "amber",
  APPROVED: "blue",
  REFUNDED: "green",
  CLOSED: "slate",
  PREPARING: "slate",
  SHIPPED: "blue",
  IN_TRANSIT: "violet",
  DELIVERED: "green",
  CREDIT: "red",
  DEBIT: "green",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={toneMap[status] ?? "slate"}>{labelStatus(status)}</Badge>;
}
