"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { RMA_ACTIONS } from "@/lib/status";

export function RmaManualItems({ defaultInvoiceNumber }: { defaultInvoiceNumber: string }) {
  const nextId = useRef(1);
  const [ids, setIds] = useState<number[]>([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Manual items (returns from a different invoice, or stock not tracked here)</Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIds((current) => [...current, nextId.current++])}
        >
          Add manual item
        </Button>
      </div>
      {ids.map((id) => (
        <div
          key={id}
          className="grid gap-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700 sm:grid-cols-6"
        >
          <div className="flex justify-end sm:col-span-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIds((current) => current.filter((x) => x !== id))}
            >
              Remove item
            </Button>
          </div>
          <div>
            <Label>Invoice No</Label>
            <Input name="manualInvoiceNumber" defaultValue={defaultInvoiceNumber} />
          </div>
          <div className="sm:col-span-2">
            <Label>Product name</Label>
            <Input name="manualProductName" required />
          </div>
          <div>
            <Label>IMEI</Label>
            <Input name="manualImei" placeholder="Optional" />
          </div>
          <div>
            <Label>Color</Label>
            <Input name="manualColor" />
          </div>
          <div>
            <Label>Grade</Label>
            <Input name="manualGrade" />
          </div>
          <div>
            <Label>Unit price GBP</Label>
            <Input name="manualPriceGbp" type="number" step="0.01" defaultValue={0} />
          </div>
          <div>
            <Label>Unit price EUR</Label>
            <Input name="manualPriceEur" type="number" step="0.01" defaultValue={0} />
          </div>
          <div>
            <Label>Action</Label>
            <Select name="manualAction" defaultValue="RESTOCK">
              {RMA_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Reason</Label>
            <Input name="manualReason" placeholder="e.g. Back glass broken" />
          </div>
        </div>
      ))}
    </div>
  );
}
