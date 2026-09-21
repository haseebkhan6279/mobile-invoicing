"use client";

import { Barcode } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeScannedImei } from "@/lib/imei";
import type { StockImeiLookup } from "@/lib/stock-imei";

export type ScannedStockUnit = StockImeiLookup;

export function InvoiceImeiScanner({
  disabled,
  onScan,
}: {
  disabled?: boolean;
  onScan: (unit: ScannedStockUnit) => string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const refocus = () => {
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submitScan = async (raw: string) => {
    const imei = normalizeScannedImei(raw);
    setValue("");
    setError(null);
    setOk(null);
    if (!imei) {
      refocus();
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/stock/by-imei?imei=${encodeURIComponent(imei)}`);
      const json = (await res.json().catch(() => null)) as
        | { data?: ScannedStockUnit; error?: string }
        | null;
      if (!res.ok || !json?.data) {
        setError(json?.error || `IMEI ${imei} was not found in stock`);
        return;
      }
      const message = onScan(json.data);
      if (message) setError(message);
      else setOk(`${json.data.imei} · ${json.data.productName}`);
    } catch {
      setError("Could not look up that IMEI. Try again.");
    } finally {
      setPending(false);
      refocus();
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <Label htmlFor="imei-scan" className="mb-1 flex items-center gap-2">
        <Barcode className="h-4 w-4" />
        Scan IMEI
      </Label>
      <Input
        ref={inputRef}
        id="imei-scan"
        value={value}
        autoFocus
        autoComplete="off"
        disabled={disabled || pending}
        placeholder="Click here, then scan — or type the IMEI and press Enter"
        className="font-mono"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          if (!pending) void submitScan(value);
        }}
      />
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        Works with a ScanAvenger (or any USB/Bluetooth scanner that types like a keyboard).
        Keep this box focused and scan one IMEI after another — the model is filled in from stock.
      </p>
      {pending ? (
        <p className="mt-2 text-sm text-slate-500">Looking up…</p>
      ) : error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : ok ? (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">Added {ok}</p>
      ) : null}
    </div>
  );
}
