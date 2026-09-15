"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImeiEntry } from "@/lib/imei-notes";

const emptyEntry = (): ImeiEntry => ({ imei: "", notes: "" });

export function InvoiceImeiEntriesField({
  name = "lineImeiEntries",
  initial,
}: {
  name?: string;
  initial?: ImeiEntry[];
}) {
  const [entries, setEntries] = useState<ImeiEntry[]>(
    initial?.length ? initial : [emptyEntry()],
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        entries
          .map((entry) => ({ imei: entry.imei.trim(), notes: entry.notes.trim() }))
          .filter((entry) => entry.imei),
      ),
    [entries],
  );

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={payload} />
      {entries.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            {index === 0 ? <Label className="mb-1">IMEI</Label> : null}
            <Input
              value={entry.imei}
              onChange={(event) =>
                setEntries((current) =>
                  current.map((row, i) =>
                    i === index ? { ...row, imei: event.target.value } : row,
                  ),
                )
              }
              placeholder="15-digit IMEI"
              autoComplete="off"
              className="font-mono"
            />
          </div>
          <div className="min-w-0 flex-[1.2]">
            {index === 0 ? <Label className="mb-1">Notes / supplier</Label> : null}
            <Input
              value={entry.notes}
              onChange={(event) =>
                setEntries((current) =>
                  current.map((row, i) =>
                    i === index ? { ...row, notes: event.target.value } : row,
                  ),
                )
              }
              placeholder="Supplier or source (optional)"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 w-11 shrink-0 px-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
            onClick={() =>
              setEntries((current) =>
                current.length === 1
                  ? [emptyEntry()]
                  : current.filter((_, i) => i !== index),
              )
            }
            aria-label="Remove IMEI"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setEntries((current) => [...current, emptyEntry()])}
      >
        Add IMEI
      </Button>
    </div>
  );
}
