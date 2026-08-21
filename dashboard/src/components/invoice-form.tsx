"use client";

import { useState } from "react";
import { getAvailableImeis } from "@/actions/stock";
import { CustomerPicker, type CustomerHit } from "@/components/customer-picker";
import { InvoiceLineProductField, type ProductHit } from "@/components/invoice-line-product-field";
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

function InvoiceLine({
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
  const [productName, setProductName] = useState(emptyLine.productName);
  const [color, setColor] = useState(emptyLine.color);
  const [network, setNetwork] = useState(emptyLine.network);
  const [grade, setGrade] = useState(emptyLine.grade);
  const [priceGbp, setPriceGbp] = useState(emptyLine.unitPriceGbp);
  const [priceEur, setPriceEur] = useState(emptyLine.unitPriceEur);
  const [qty, setQty] = useState(emptyLine.qty);
  const [imeis, setImeis] = useState(emptyLine.imeis);
  const [availableImeis, setAvailableImeis] = useState<string[]>([]);

  const handleSelect = async (hit: ProductHit) => {
    setProductName(hit.productName);
    setColor(hit.color);
    setNetwork(hit.network);
    setGrade(hit.grade);
    setPriceGbp(hit.costGbp);
    setPriceEur(hit.costEur);
    const imeiList = await getAvailableImeis({
      productName: hit.productName,
      color: hit.color,
      network: hit.network,
      grade: hit.grade,
    });
    setAvailableImeis(imeiList);
    setImeis(imeiList.slice(0, qty).join("\n"));
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <Label>Product name</Label>
          <InvoiceLineProductField
            value={productName}
            onChange={setProductName}
            onSelect={handleSelect}
          />
          <p className="mt-1 text-xs text-slate-500">
            Start typing to pick from stock on hand and auto-fill details.
          </p>
        </div>
        <div>
          <Label>Color</Label>
          <Select name="lineColor" value={color} onChange={(event) => setColor(event.target.value)}>
            {colors.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Network</Label>
          <Select
            name="lineNetwork"
            value={network}
            onChange={(event) => setNetwork(event.target.value)}
          >
            {networks.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Grade</Label>
          <Select name="lineGrade" value={grade} onChange={(event) => setGrade(event.target.value)}>
            {grades.map((g) => (
              <option key={g.id} value={g.code}>
                {g.code}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Qty</Label>
          <Input
            name="lineQty"
            type="number"
            min={1}
            value={qty}
            onChange={(event) => {
              const next = Math.max(1, Number(event.target.value) || 1);
              setQty(next);
              if (availableImeis.length) setImeis(availableImeis.slice(0, next).join("\n"));
            }}
          />
        </div>
        <div>
          <Label>Unit price GBP</Label>
          <Input
            name="linePriceGbp"
            type="number"
            step="0.01"
            value={priceGbp}
            onChange={(event) => {
              const next = Number(event.target.value) || 0;
              setPriceGbp(next);
              if (priceEur === 0) setPriceEur(eurFromGbp(next, fx));
            }}
          />
        </div>
        <div>
          <Label>Unit price EUR</Label>
          <Input
            name="linePriceEur"
            type="number"
            step="0.01"
            value={priceEur}
            onChange={(event) => setPriceEur(Number(event.target.value) || 0)}
          />
        </div>
      </div>
      <div>
        <Label>IMEIs for this line (qty must match)</Label>
        <Textarea
          name="lineImeis"
          required
          placeholder="One 15-digit IMEI per line"
          value={imeis}
          onChange={(event) => setImeis(event.target.value)}
        />
        {availableImeis.length ? (
          <p className="mt-1 text-xs text-slate-500">
            {availableImeis.length} available for this spec
            {availableImeis.length < qty ? " — not enough in stock for this qty" : ""}.
            Pre-filled; edit to swap specific units.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function InvoiceForm({
  grades,
  colors,
  networks,
  initialCustomer,
}: {
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
  initialCustomer?: CustomerHit | null;
}) {
  const [lineCount, setLineCount] = useState(1);
  const [fx, setFx] = useState(DEFAULT_FX_RATE);

  return (
    <div className="space-y-6">
      <CustomerPicker initial={initialCustomer} returnTo="/invoices/new" />
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
        <div>
          <Label htmlFor="shippingLabel">Shipping line description</Label>
          <Input
            id="shippingLabel"
            name="shippingLabel"
            placeholder="UPS Express Saver / Postage &amp; Packaging"
          />
        </div>
        <div>
          <Label htmlFor="paymentTerms">Payment terms</Label>
          <Input id="paymentTerms" name="paymentTerms" defaultValue="Immediate" />
        </div>
        <div>
          <Label htmlFor="warrantyTerms">Warranty terms</Label>
          <Input id="warrantyTerms" name="warrantyTerms" defaultValue="3 months" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Invoice lines</h2>
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
          <InvoiceLine key={index} grades={grades} colors={colors} networks={networks} fx={fx} />
        ))}
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>
    </div>
  );
}
