"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Lookup = { id: string; name?: string; code?: string };

const emptyBatch = {
  productName: "",
  brand: "",
  color: "Black",
  network: "Unlocked",
  grade: "A",
  costGbp: 0,
  imeis: "",
};

function countImeis(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function StockBatchLine({
  grades,
  colors,
  networks,
  onRemove,
  onTotalChange,
}: {
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
  onRemove: () => void;
  onTotalChange: (total: number) => void;
}) {
  const [imeisText, setImeisText] = useState("");
  const [qtyText, setQtyText] = useState("");

  const imeiCount = countImeis(imeisText);
  const qty = Number(qtyText) || 0;
  // The backend treats batchQty as the total unit count for the batch — any
  // pasted IMEIs are tagged first, the rest are created without an IMEI yet.
  const total = Math.max(imeiCount, qty);

  useEffect(() => {
    onTotalChange(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const handleImeisChange = (text: string) => {
    setImeisText(text);
    // Keep the total-quantity field truthful if pasted IMEIs outnumber it —
    // never silently drop IMEIs the user just entered.
    const nextImeiCount = countImeis(text);
    if (nextImeiCount > qty) setQtyText(String(nextImeiCount));
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove batch
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 lg:grid-cols-[1.5fr_0.9fr_0.55fr_0.8fr_0.8fr_0.85fr_0.65fr_1.5fr] lg:gap-y-1.5">
        <div className="col-span-2 sm:col-span-4 lg:col-span-1">
          <Label>Product name</Label>
          <Input name="batchProduct" required placeholder="iPhone 14 128GB" />
        </div>
        <div>
          <Label>Brand</Label>
          <Input name="batchBrand" placeholder="Apple" />
        </div>
        <div>
          <Label>Grade</Label>
          <Select name="batchGrade" defaultValue={emptyBatch.grade}>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.code}>
                {grade.code}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Color</Label>
          <Select name="batchColor" defaultValue={emptyBatch.color}>
            {colors.map((color) => (
              <option key={color.id} value={color.name}>
                {color.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Network</Label>
          <Select name="batchNetwork" defaultValue={emptyBatch.network}>
            {networks.map((network) => (
              <option key={network.id} value={network.name}>
                {network.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Unit cost GBP</Label>
          <Input name="batchCostGbp" type="number" step="0.01" defaultValue={emptyBatch.costGbp} />
        </div>
        <div>
          <Label className="whitespace-nowrap">Total qty</Label>
          <Input
            name="batchQty"
            type="number"
            min={0}
            placeholder="0"
            value={qtyText}
            onChange={(event) => setQtyText(event.target.value)}
          />
        </div>
        <div className="col-span-2 sm:col-span-4 lg:col-span-1">
          <Label>IMEIs (optional)</Label>
          <Textarea
            name="batchImeis"
            rows={1}
            className="min-h-11 resize-y"
            placeholder="One 15-digit IMEI per line"
            value={imeisText}
            onChange={(event) => handleImeisChange(event.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {imeiCount > 0
          ? `${imeiCount} of ${total} units have an IMEI. `
          : ""}
        Total qty is the full batch size — paste IMEIs above to tag specific units, the rest are added without one (taggable later).
      </p>
    </div>
  );
}

export function StockBatchForm({
  grades,
  colors,
  networks,
  suppliers,
  purchaseOrders,
  defaultSupplierId,
  defaultPurchaseOrderId,
  showLedgerToggle = true,
}: {
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
  suppliers: { id: string; name: string }[];
  purchaseOrders?: { id: string; poNumber: string; supplierId: string }[];
  defaultSupplierId?: string;
  defaultPurchaseOrderId?: string;
  showLedgerToggle?: boolean;
}) {
  const nextBatchId = useRef(1);
  const [batchIds, setBatchIds] = useState<number[]>([0]);
  const [supplierId, setSupplierId] = useState(defaultSupplierId ?? "");
  const [batchTotals, setBatchTotals] = useState<Record<number, number>>({});

  const grandTotal = useMemo(
    () => Object.values(batchTotals).reduce((sum, n) => sum + n, 0),
    [batchTotals],
  );

  const removeBatch = (batchId: number) => {
    setBatchIds((current) => current.filter((id) => id !== batchId));
    setBatchTotals((current) => {
      const next = { ...current };
      delete next[batchId];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="supplierId">Supplier</Label>
          <Select
            id="supplierId"
            name="supplierId"
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
          >
            <option value="">None</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="purchaseOrderId">Purchase order</Label>
          <Select
            id="purchaseOrderId"
            name="purchaseOrderId"
            defaultValue={defaultPurchaseOrderId ?? ""}
          >
            <option value="">Direct intake</option>
            {(purchaseOrders ?? [])
              .filter((po) => !supplierId || po.supplierId === supplierId)
              .map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber}
                </option>
              ))}
          </Select>
        </div>
      </div>
      {showLedgerToggle ? (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" name="postLedger" defaultChecked className="rounded" />
          Post goods value as CREDIT on supplier hisab
        </label>
      ) : (
        <input type="hidden" name="postLedger" value="on" />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">Grade-wise batches</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900">
            {grandTotal} total {grandTotal === 1 ? "piece" : "pieces"}
          </span>
        </div>
        {batchIds.map((batchId) => (
          <StockBatchLine
            key={batchId}
            grades={grades}
            colors={colors}
            networks={networks}
            onRemove={() => removeBatch(batchId)}
            onTotalChange={(total) =>
              setBatchTotals((current) => ({ ...current, [batchId]: total }))
            }
          />
        ))}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setBatchIds((current) => [...current, nextBatchId.current++])}
          >
            Add grade batch
          </Button>
        </div>
      </div>
    </div>
  );
}
