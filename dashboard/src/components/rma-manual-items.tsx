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
      <Label>Manual items (returns from a different invoice, or stock not tracked here)</Label>
      {ids.map((id) => (
        <div
          key={id}
          className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700 sm:grid-cols-4 lg:grid-cols-[0.9fr_1.6fr_1fr_0.8fr_0.6fr_0.9fr_0.9fr_1.4fr] lg:gap-y-1.5"
        >
          <div className="col-span-2 flex justify-end sm:col-span-4 lg:order-last lg:col-span-8">
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
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
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
            <Label>Action</Label>
            <Select name="manualAction" defaultValue="RESTOCK">
              {RMA_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </div>
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <Label>Reason</Label>
            <Input name="manualReason" placeholder="e.g. Back glass broken" />
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIds((current) => [...current, nextId.current++])}
        >
          Add manual item
        </Button>
      </div>
    </div>
  );
}
