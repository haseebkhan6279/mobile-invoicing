"use client";

import { useEffect, useState } from "react";
import { searchProductNames, searchStockProducts } from "@/actions/stock";
import { Input } from "@/components/ui/input";

export type ProductHit = {
  productName: string;
  color: string;
  network: string;
  grade: string;
  count: number;
  costGbp: number;
  supplierName: string | null;
};

export function InvoiceLineProductField({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (hit: ProductHit) => void;
}) {
  const [hits, setHits] = useState<ProductHit[]>([]);
  // Names used before (invoices, purchase orders, sold stock) with nothing in
  // stock right now — picking one only fills the name.
  const [pastNames, setPastNames] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const [results, names] = await Promise.all([
        searchStockProducts(term),
        searchProductNames(term).catch(() => [] as string[]),
      ]);
      if (!cancelled) {
        const inStock = new Set(results.map((hit) => hit.productName.toLowerCase()));
        setHits(results);
        setPastNames(names.filter((name) => !inStock.has(name.toLowerCase())));
        setOpen(true);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value]);

  return (
    <div className="relative">
      <Input
        name="lineProduct"
        required
        autoComplete="off"
        placeholder="iPhone 14 128GB"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          if (next.trim().length < 2) {
            setHits([]);
            setPastNames([]);
            setOpen(false);
          }
        }}
        onFocus={() => (hits.length || pastNames.length) && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (hits.length > 0 || pastNames.length > 0) ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {hits.map((hit, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  onChange(hit.productName);
                  setOpen(false);
                  onSelect(hit);
                }}
              >
                <div className="font-medium">{hit.productName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {hit.color} · {hit.network} · {hit.grade} · {hit.count} in stock
                  {hit.supplierName ? ` · from ${hit.supplierName}` : ""}
                </div>
              </button>
            </li>
          ))}
          {pastNames.length ? (
            <li className="border-t border-slate-100 px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 first:border-0 dark:border-slate-800">
              Previously used · not in stock
            </li>
          ) : null}
          {pastNames.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
