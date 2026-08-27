"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { BankCurrency } from "@/lib/company";

export function CurrencyPrintControls({
  defaultCurrency,
  defaultRate,
}: {
  defaultCurrency: BankCurrency;
  defaultRate: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currency = (searchParams.get("currency") as BankCurrency | null) ?? defaultCurrency;
  const rate = Number(searchParams.get("rate")) || defaultRate;

  const updateParams = (next: { currency?: string; rate?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.currency !== undefined) params.set("currency", next.currency);
    if (next.rate !== undefined) params.set("rate", next.rate);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="no-print flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
      <div>
        <Label htmlFor="print-currency">Print currency</Label>
        <Select
          id="print-currency"
          value={currency}
          onChange={(event) => updateParams({ currency: event.target.value })}
        >
          <option value="GBP">GBP — £</option>
          <option value="EUR">EUR — €</option>
        </Select>
      </div>
      {currency === "EUR" ? (
        <div>
          <Label htmlFor="print-rate">Exchange rate (GBP → EUR)</Label>
          <Input
            id="print-rate"
            type="number"
            step="0.0001"
            value={rate}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "") return;
              updateParams({ rate: value });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
