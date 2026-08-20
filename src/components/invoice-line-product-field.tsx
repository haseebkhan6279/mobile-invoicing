"use client";

import { useEffect, useState } from "react";
import { searchStockProducts } from "@/actions/stock";
import { Input } from "@/components/ui/input";

export type ProductHit = {
  productName: string;
  color: string;
  network: string;
  grade: string;
  count: number;
  costGbp: number;
  costEur: number;
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      const results = await searchStockProducts(term);
      if (!cancelled) {
        setHits(results);
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
            setOpen(false);
          }
        }}
        onFocus={() => hits.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && hits.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {hits.map((hit, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => {
                  onChange(hit.productName);
                  setOpen(false);
                  onSelect(hit);
                }}
              >
                <div className="font-medium">{hit.productName}</div>
                <div className="text-xs text-slate-500">
                  {hit.color} · {hit.network} · {hit.grade} · {hit.count} in stock
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
