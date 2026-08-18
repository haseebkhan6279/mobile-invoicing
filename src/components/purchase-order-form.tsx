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
  const [lines, setLines] = useState([emptyLine]);
  const [fx, setFx] = useState(DEFAULT_FX_RATE);

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
            defaultValue="0"
            onBlur={(event) => {
              const eur = document.getElementById(
                "shippingCostEur",
              ) as HTMLInputElement | null;
              if (eur && !eur.value) {
                eur.value = String(eurFromGbp(Number(event.target.value), fx));
              }
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
            defaultValue="0"
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
            onClick={() => setLines((current) => [...current, { ...emptyLine }])}
          >
            Add line
          </Button>
        </div>
        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-7"
          >
            <div className="md:col-span-2">
              <Label>Product</Label>
              <Input
                name="lineProduct"
                required
                value={line.productName}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((item, i) =>
                      i === index
                        ? { ...item, productName: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </div>
            <div>
              <Label>Color</Label>
              <Select name="lineColor" defaultValue={line.color}>
                {colors.map((color) => (
                  <option key={color.id} value={color.name}>
                    {color.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Network</Label>
              <Select name="lineNetwork" defaultValue={line.network}>
                {networks.map((network) => (
                  <option key={network.id} value={network.name}>
                    {network.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Grade</Label>
              <Select name="lineGrade" defaultValue={line.grade}>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.code}>
                    {grade.code}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Qty</Label>
              <Input name="lineQty" type="number" min={1} defaultValue={line.qty} />
            </div>
            <div>
              <Label>Unit GBP</Label>
              <Input
                name="lineCostGbp"
                type="number"
                step="0.01"
                defaultValue={line.unitCostGbp}
                onBlur={(event) => {
                  const sibling = event.currentTarget
                    .closest("div")
                    ?.parentElement?.querySelector(
                      'input[name="lineCostEur"]',
                    ) as HTMLInputElement | null;
                  if (sibling && Number(sibling.value) === 0) {
                    sibling.value = String(
                      eurFromGbp(Number(event.target.value), fx),
                    );
                  }
                }}
              />
            </div>
            <div>
              <Label>Unit EUR</Label>
              <Input
                name="lineCostEur"
                type="number"
                step="0.01"
                defaultValue={line.unitCostEur}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>
    </div>
  );
}
