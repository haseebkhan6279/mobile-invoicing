"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FX_RATE, eurFromGbp } from "@/lib/money";
import { PO_STATUSES } from "@/lib/status";

type Lookup = { id: string; name?: string; code?: string; label?: string };

export type PoLineSeed = {
  productName: string;
  color: string;
  network: string;
  grade: string;
  qty: number;
  unitCostGbp: number;
  unitCostEur: number;
};

const emptyLine: PoLineSeed = {
  productName: "",
  color: "Black",
  network: "Unlocked",
  grade: "A",
  qty: 1,
  unitCostGbp: 0,
  unitCostEur: 0,
};

function PoLine({
  colors,
  networks,
  grades,
  fx,
  initial,
  onRemove,
}: {
  colors: Lookup[];
  networks: Lookup[];
  grades: Lookup[];
  fx: number;
  initial?: PoLineSeed;
  onRemove: () => void;
}) {
  const seed = initial ?? emptyLine;
  const [eurValue, setEurValue] = useState(seed.unitCostEur);
  const [eurKey, setEurKey] = useState(0);
  const eurTouched = useRef(seed.unitCostEur > 0);
  const uid = useId();

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-7 dark:border-slate-800">
      <div className="flex items-start justify-end md:col-span-7 md:order-last">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove line
        </Button>
      </div>
      <div className="md:col-span-2">
        <Label>Product</Label>
        <Input name="lineProduct" required defaultValue={seed.productName} />
      </div>
      <div>
        <Label>Color</Label>
        <Input name="lineColor" list={`${uid}-colors`} defaultValue={seed.color} />
        <datalist id={`${uid}-colors`}>
          {colors.map((color) => (
            <option key={color.id} value={color.name} />
          ))}
        </datalist>
      </div>
      <div>
        <Label>Network</Label>
        <Input name="lineNetwork" list={`${uid}-networks`} defaultValue={seed.network} />
        <datalist id={`${uid}-networks`}>
          {networks.map((network) => (
            <option key={network.id} value={network.name} />
          ))}
        </datalist>
      </div>
      <div>
        <Label>Grade</Label>
        <Input name="lineGrade" list={`${uid}-grades`} defaultValue={seed.grade} />
        <datalist id={`${uid}-grades`}>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.code} />
          ))}
        </datalist>
      </div>
      <div>
        <Label>Qty</Label>
        <Input name="lineQty" type="number" min={1} defaultValue={seed.qty} />
      </div>
      <div>
        <Label>Unit GBP</Label>
        <Input
          name="lineCostGbp"
          type="number"
          step="0.01"
          defaultValue={seed.unitCostGbp}
          onChange={(event) => {
            if (eurTouched.current) return;
            const raw = event.target.value;
            if (raw === "") return;
            const n = Number(raw);
            if (!Number.isFinite(n)) return;
            setEurValue(eurFromGbp(n, fx));
            setEurKey((k) => k + 1);
          }}
        />
      </div>
      <div>
        <Label>Unit EUR</Label>
        <Input
          key={eurKey}
          name="lineCostEur"
          type="number"
          step="0.01"
          defaultValue={eurValue}
          onChange={() => {
            eurTouched.current = true;
          }}
        />
      </div>
    </div>
  );
}

export function PurchaseOrderForm({
  mode = "create",
  suppliers,
  supplierName,
  grades,
  colors,
  networks,
  initialLines,
  initialSupplierId,
  initialStatus,
  initialFxRate,
  initialShippingGbp,
  initialShippingEur,
  initialActualCostGbp,
  initialActualCostEur,
  initialNotes,
  existingAttachmentName,
}: {
  mode?: "create" | "edit";
  suppliers: { id: string; name: string }[];
  supplierName?: string;
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
  initialLines?: PoLineSeed[];
  initialSupplierId?: string;
  initialStatus?: string;
  initialFxRate?: number;
  initialShippingGbp?: number;
  initialShippingEur?: number;
  initialActualCostGbp?: number;
  initialActualCostEur?: number;
  initialNotes?: string;
  existingAttachmentName?: string | null;
}) {
  const nextLineId = useRef((initialLines?.length ?? 1));
  const [lineIds, setLineIds] = useState<number[]>(
    Array.from({ length: initialLines?.length ?? 1 }, (_, i) => i),
  );
  const [fx, setFx] = useState(initialFxRate ?? DEFAULT_FX_RATE);
  const statusOptions = mode === "edit" ? PO_STATUSES : (["DRAFT", "ORDERED"] as const);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="supplierId">Supplier</Label>
          {mode === "edit" ? (
            <Input value={supplierName ?? ""} disabled />
          ) : (
            <Select id="supplierId" name="supplierId" required defaultValue={initialSupplierId ?? ""}>
              <option value="" disabled>
                Select supplier
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={initialStatus ?? "ORDERED"}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fxRate">FX rate (GBP → EUR)</Label>
          <Input
            id="fxRate"
            name="fxRate"
            type="number"
            step="0.0001"
            defaultValue={initialFxRate ?? DEFAULT_FX_RATE}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") return;
              const n = Number(raw);
              if (Number.isFinite(n)) setFx(n);
            }}
          />
        </div>
        <div>
          <Label htmlFor="shippingCostGbp">Shipping cost GBP</Label>
          <Input
            id="shippingCostGbp"
            name="shippingCostGbp"
            type="number"
            step="0.01"
            defaultValue={initialShippingGbp ?? 0}
          />
        </div>
        <div>
          <Label htmlFor="shippingCostEur">Shipping cost EUR</Label>
          <Input
            id="shippingCostEur"
            name="shippingCostEur"
            type="number"
            step="0.01"
            defaultValue={initialShippingEur ?? 0}
          />
        </div>
        {mode === "edit" ? (
          <>
            <div>
              <Label htmlFor="actualCostGbp">Actual cost GBP</Label>
              <Input
                id="actualCostGbp"
                name="actualCostGbp"
                type="number"
                step="0.01"
                defaultValue={initialActualCostGbp ?? 0}
              />
            </div>
            <div>
              <Label htmlFor="actualCostEur">Actual cost EUR</Label>
              <Input
                id="actualCostEur"
                name="actualCostEur"
                type="number"
                step="0.01"
                defaultValue={initialActualCostEur ?? 0}
              />
            </div>
          </>
        ) : null}
      </div>

      <div>
        <Label htmlFor="attachment">
          {existingAttachmentName ? "Replace attached PO file" : "Attach incoming PO file"}
        </Label>
        <Input id="attachment" name="attachment" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {existingAttachmentName
            ? `Currently attached: ${existingAttachmentName}. Choose a new file to replace it.`
            : "PDF or image of the supplier's PO. Max 4MB."}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Lines</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLineIds((current) => [...current, nextLineId.current++])}
          >
            Add line
          </Button>
        </div>
        {lineIds.map((lineId, index) => (
          <PoLine
            key={lineId}
            colors={colors}
            networks={networks}
            grades={grades}
            fx={fx}
            initial={initialLines?.[index]}
            onRemove={() => setLineIds((current) => current.filter((id) => id !== lineId))}
          />
        ))}
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initialNotes ?? ""} />
      </div>
    </div>
  );
}
