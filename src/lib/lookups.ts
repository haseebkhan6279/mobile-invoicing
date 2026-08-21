import { prisma } from "@/lib/prisma";

export async function getLookups() {
  const [grades, colors, networks, suppliers, customers] = await Promise.all([
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
    prisma.network.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, take: 50 }),
  ]);
  return { grades, colors, networks, suppliers, customers };
}

export function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function toOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

export function toOptionalNumber(value: FormDataEntryValue | null) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
