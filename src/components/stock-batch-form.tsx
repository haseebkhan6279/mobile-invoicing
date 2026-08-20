"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FX_RATE, eurFromGbp } from "@/lib/money";

type Lookup = { id: string; name?: string; code?: string };

const emptyBatch = {
  productName: "",
  brand: "",
  color: "Black",
  network: "Unlocked",
  grade: "A",
  costGbp: 0,
  costEur: 0,
  imeis: "",
};

function StockBatchLine({
  grades,
  colors,
  networks,
  fx,
}: {
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
  fx: number;
}) {
  const [costGbp, setCostGbp] = useState(emptyBatch.costGbp);
  const [costEur, setCostEur] = useState(emptyBatch.costEur);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
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
          <Input
            name="batchCostGbp"
            type="number"
            step="0.01"
            value={costGbp}
            onChange={(event) => {
              const next = Number(event.target.value) || 0;
              setCostGbp(next);
              if (costEur === 0) setCostEur(eurFromGbp(next, fx));
            }}
          />
        </div>
        <div>
          <Label>Unit cost EUR</Label>
          <Input
            name="batchCostEur"
            type="number"
            step="0.01"
            value={costEur}
            onChange={(event) => setCostEur(Number(event.target.value) || 0)}
          />
        </div>
      </div>
      <div>
        <Label>IMEIs (one per line, 15 digits)</Label>
        <Textarea name="batchImeis" required placeholder="353456789012345" />
      </div>
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
  const [batchCount, setBatchCount] = useState(1);
  const [fx] = useState(DEFAULT_FX_RATE);
  const [supplierId, setSupplierId] = useState(defaultSupplierId ?? "");

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
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="postLedger" defaultChecked className="rounded" />
          Post goods value as CREDIT on supplier hisab
        </label>
      ) : (
        <input type="hidden" name="postLedger" value="on" />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Grade-wise batches</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setBatchCount((current) => current + 1)}
          >
            Add grade batch
          </Button>
        </div>
        {Array.from({ length: batchCount }).map((_, index) => (
          <StockBatchLine key={index} grades={grades} colors={colors} networks={networks} fx={fx} />
        ))}
      </div>
    </div>
  );
}
