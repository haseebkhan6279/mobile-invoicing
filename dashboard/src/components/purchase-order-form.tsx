"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FX_RATE, eurFromGbp } from "@/lib/money";

type Lookup = { id: string; name?: string; code?: string; label?: string };

const emptyLine = {
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
}: {
  colors: Lookup[];
  networks: Lookup[];
  grades: Lookup[];
  fx: number;
}) {
  const [costGbp, setCostGbp] = useState(emptyLine.unitCostGbp);
  const [costEur, setCostEur] = useState(emptyLine.unitCostEur);

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-7">
      <div className="md:col-span-2">
        <Label>Product</Label>
        <Input name="lineProduct" required defaultValue={emptyLine.productName} />
      </div>
      <div>
        <Label>Color</Label>
        <Select name="lineColor" defaultValue={emptyLine.color}>
          {colors.map((color) => (
            <option key={color.id} value={color.name}>
              {color.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Network</Label>
        <Select name="lineNetwork" defaultValue={emptyLine.network}>
          {networks.map((network) => (
            <option key={network.id} value={network.name}>
              {network.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Grade</Label>
        <Select name="lineGrade" defaultValue={emptyLine.grade}>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.code}>
              {grade.code}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Qty</Label>
        <Input name="lineQty" type="number" min={1} defaultValue={emptyLine.qty} />
      </div>
      <div>
        <Label>Unit GBP</Label>
        <Input
          name="lineCostGbp"
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
        <Label>Unit EUR</Label>
        <Input
          name="lineCostEur"
          type="number"
          step="0.01"
          value={costEur}
          onChange={(event) => setCostEur(Number(event.target.value) || 0)}
        />
      </div>
    </div>
  );
}

export function PurchaseOrderForm({
  suppliers,
  grades,
  colors,
  networks,
}: {
  suppliers: { id: string; name: string }[];
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
}) {
  const [lineCount, setLineCount] = useState(1);
  const [fx, setFx] = useState(DEFAULT_FX_RATE);
  const [shippingGbp, setShippingGbp] = useState(0);
  const [shippingEur, setShippingEur] = useState(0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="supplierId">Supplier</Label>
          <Select id="supplierId" name="supplierId" required defaultValue="">
            <option value="" disabled>
              Select supplier
            </option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="ORDERED">
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="fxRate">FX rate (GBP → EUR)</Label>
          <Input
            id="fxRate"
            name="fxRate"
            type="number"
            step="0.0001"
            value={fx}
            onChange={(event) => setFx(Number(event.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="shippingCostGbp">Shipping cost GBP</Label>
          <Input
            id="shippingCostGbp"
            name="shippingCostGbp"
            type="number"
            step="0.01"
            value={shippingGbp}
            onChange={(event) => {
              const next = Number(event.target.value) || 0;
              setShippingGbp(next);
              if (shippingEur === 0) setShippingEur(eurFromGbp(next, fx));
            }}
          />
        </div>
        <div>
          <Label htmlFor="shippingCostEur">Shipping cost EUR</Label>
          <Input
            id="shippingCostEur"
            name="shippingCostEur"
            type="number"
            step="0.01"
            value={shippingEur}
            onChange={(event) => setShippingEur(Number(event.target.value) || 0)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Lines</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLineCount((current) => current + 1)}
          >
            Add line
          </Button>
        </div>
        {Array.from({ length: lineCount }).map((_, index) => (
          <PoLine key={index} colors={colors} networks={networks} grades={grades} fx={fx} />
        ))}
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>
    </div>
  );
}
