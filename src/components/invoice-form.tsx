"use client";

import { useState } from "react";
import { CustomerPicker } from "@/components/customer-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FX_RATE, eurFromGbp } from "@/lib/money";

type Lookup = { id: string; name?: string; code?: string };

const emptyLine = {
  productName: "",
  color: "Black",
  network: "Unlocked",
  grade: "A",
  qty: 1,
  unitPriceGbp: 0,
  unitPriceEur: 0,
  imeis: "",
};

export function InvoiceForm({
  grades,
  colors,
  networks,
}: {
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
}) {
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [fx, setFx] = useState(DEFAULT_FX_RATE);

  return (
    <div className="space-y-6">
      <CustomerPicker />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="status">Payment status</Label>
          <Select id="status" name="status" defaultValue="PENDING">
            <option value="PENDING">Pending</option>
            <option value="AWAITING_PAYMENT">Awaiting payment</option>
            <option value="PAID">Paid</option>
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
          <Label htmlFor="shippingCostGbp">Shipping GBP</Label>
          <Input
            id="shippingCostGbp"
            name="shippingCostGbp"
            type="number"
            step="0.01"
            defaultValue="0"
          />
        </div>
        <div>
          <Label htmlFor="shippingCostEur">Shipping EUR</Label>
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
          <h2 className="font-medium">Invoice lines</h2>
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
          <div key={index} className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="grid gap-3 md:grid-cols-6">
              <div className="md:col-span-2">
                <Label>Product name</Label>
                <Input name="lineProduct" required placeholder="iPhone 14 128GB" />
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
                <Input name="lineQty" type="number" min={1} defaultValue={1} />
              </div>
              <div>
                <Label>Unit price GBP</Label>
                <Input
                  name="linePriceGbp"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  onBlur={(event) => {
                    const eur = event.currentTarget
                      .closest("div")
                      ?.parentElement?.querySelector(
                        'input[name="linePriceEur"]',
                      ) as HTMLInputElement | null;
                    if (eur && Number(eur.value) === 0) {
                      eur.value = String(
                        eurFromGbp(Number(event.target.value), fx),
                      );
                    }
                  }}
                />
              </div>
              <div>
                <Label>Unit price EUR</Label>
                <Input
                  name="linePriceEur"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
            </div>
            <div>
              <Label>IMEIs for this line (qty must match)</Label>
              <Textarea
                name="lineImeis"
                required
                placeholder="One 15-digit IMEI per line"
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
