"use client";

import { useId, useRef, useState } from "react";
import { getAvailableImeis } from "@/actions/stock";
import { getAvailableRmaCredits, type AvailableRmaCredit } from "@/actions/rma";
import { CustomerPicker, type CustomerHit } from "@/components/customer-picker";
import { InvoiceLineProductField, type ProductHit } from "@/components/invoice-line-product-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FX_RATE, eurFromGbp, formatEur, formatGbp } from "@/lib/money";

function creditValue(credit: AvailableRmaCredit) {
  const totalGbp = credit.items.reduce((sum, item) => sum + item.unitPriceGbp, 0);
  const totalEur = credit.items.reduce((sum, item) => sum + item.unitPriceEur, 0);
  return { totalGbp, totalEur };
}

type Lookup = { id: string; name?: string; code?: string };

type LineSeed = {
  color: string;
  network: string;
  grade: string;
  unitPriceGbp: number;
  unitPriceEur: number;
  imeis: string;
};

const emptySeed: LineSeed = {
  color: "Black",
  network: "Unlocked",
  grade: "A",
  unitPriceGbp: 0,
  unitPriceEur: 0,
  imeis: "",
};

function InvoiceLine({
  grades,
  colors,
  networks,
  fx,
  onRemove,
}: {
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
  fx: number;
  onRemove: () => void;
}) {
  const uid = useId();
  const [productName, setProductName] = useState("");
  const [seed, setSeed] = useState<LineSeed>(emptySeed);
  const [autofillKey, setAutofillKey] = useState(0);
  const [eurKey, setEurKey] = useState(0);
  const [availableImeis, setAvailableImeis] = useState<string[]>([]);
  const qtyRef = useRef<HTMLInputElement>(null);
  const eurTouched = useRef(false);

  const handleSelect = async (hit: ProductHit) => {
    setProductName(hit.productName);
    const qty = Math.max(1, Number(qtyRef.current?.value) || 1);
    const imeiList = await getAvailableImeis({
      productName: hit.productName,
      color: hit.color,
      network: hit.network,
      grade: hit.grade,
    });
    setAvailableImeis(imeiList);
    eurTouched.current = false;
    setSeed({
      color: hit.color,
      network: hit.network,
      grade: hit.grade,
      unitPriceGbp: hit.costGbp,
      unitPriceEur: hit.costEur,
      imeis: imeiList.slice(0, qty).join("\n"),
    });
    setAutofillKey((k) => k + 1);
    setEurKey((k) => k + 1);
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove line
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <Label>Product name</Label>
          <InvoiceLineProductField
            value={productName}
            onChange={setProductName}
            onSelect={handleSelect}
          />
          <p className="mt-1 text-xs text-slate-500">
            Start typing to pick from stock on hand and auto-fill details, or enter a new product.
          </p>
        </div>
        <div>
          <Label>Color</Label>
          <Input
            key={`color-${autofillKey}`}
            name="lineColor"
            list={`${uid}-colors`}
            defaultValue={seed.color}
          />
          <datalist id={`${uid}-colors`}>
            {colors.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>Network</Label>
          <Input
            key={`network-${autofillKey}`}
            name="lineNetwork"
            list={`${uid}-networks`}
            defaultValue={seed.network}
          />
          <datalist id={`${uid}-networks`}>
            {networks.map((n) => (
              <option key={n.id} value={n.name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>Grade</Label>
          <Input
            key={`grade-${autofillKey}`}
            name="lineGrade"
            list={`${uid}-grades`}
            defaultValue={seed.grade}
          />
          <datalist id={`${uid}-grades`}>
            {grades.map((g) => (
              <option key={g.id} value={g.code} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>Qty</Label>
          <Input ref={qtyRef} name="lineQty" type="number" min={1} defaultValue={1} />
        </div>
        <div>
          <Label>Unit price GBP</Label>
          <Input
            key={`gbp-${autofillKey}`}
            name="linePriceGbp"
            type="number"
            step="0.01"
            defaultValue={seed.unitPriceGbp}
            onChange={(event) => {
              if (eurTouched.current) return;
              const raw = event.target.value;
              if (raw === "") return;
              const n = Number(raw);
              if (!Number.isFinite(n)) return;
              setSeed((s) => ({ ...s, unitPriceEur: eurFromGbp(n, fx) }));
              setEurKey((k) => k + 1);
            }}
          />
        </div>
        <div>
          <Label>Unit price EUR</Label>
          <Input
            key={`eur-${eurKey}`}
            name="linePriceEur"
            type="number"
            step="0.01"
            defaultValue={seed.unitPriceEur}
            onChange={() => {
              eurTouched.current = true;
            }}
          />
        </div>
      </div>
      <div>
        <Label>IMEIs for this line (optional — you can add these later)</Label>
        <Textarea
          key={`imeis-${autofillKey}`}
          name="lineImeis"
          placeholder="One 15-digit IMEI per line (optional)"
          defaultValue={seed.imeis}
        />
        {availableImeis.length ? (
          <p className="mt-1 text-xs text-slate-500">
            {availableImeis.length} available for this spec. Pre-filled; edit to swap, add, or clear.
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
  const nextLineId = useRef(1);
  const [lineIds, setLineIds] = useState<number[]>([0]);
  const [fx, setFx] = useState(DEFAULT_FX_RATE);
  const [credits, setCredits] = useState<AvailableRmaCredit[]>([]);
  const [selectedCreditIds, setSelectedCreditIds] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <CustomerPicker
        initial={initialCustomer}
        returnTo="/invoices/new"
        onSelect={(customer) => {
          setSelectedCreditIds([]);
          getAvailableRmaCredits(customer.id).then(setCredits);
        }}
      />
      {credits.length ? (
        <div className="space-y-2 rounded-xl border border-slate-200 p-4">
          <h2 className="font-medium">Available RMA credit</h2>
          {credits.map((credit) => {
            const { totalGbp, totalEur } = creditValue(credit);
            const checked = selectedCreditIds.includes(credit.id);
            return (
              <label key={credit.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="appliedRmaIds"
                  value={credit.id}
                  checked={checked}
                  onChange={(event) =>
                    setSelectedCreditIds((current) =>
                      event.target.checked
                        ? [...current, credit.id]
                        : current.filter((id) => id !== credit.id),
                    )
                  }
                />
                {credit.rmaNumber} — {formatGbp(totalGbp)} / {formatEur(totalEur)} · from Invoice{" "}
                {credit.invoice.invoiceNumber}
              </label>
            );
          })}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="entity">Billing entity</Label>
          <Select id="entity" name="entity" defaultValue="UK">
            <option value="UK">UK — £ (Animus Corporation Limited)</option>
            <option value="NI">NI — € (Atlantic Devices Solutions LTD)</option>
          </Select>
        </div>
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
            defaultValue={DEFAULT_FX_RATE}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") return;
              const n = Number(raw);
              if (Number.isFinite(n)) setFx(n);
            }}
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
            onClick={() => setLineIds((current) => [...current, nextLineId.current++])}
          >
            Add line
          </Button>
        </div>
        {lineIds.map((lineId) => (
          <InvoiceLine
            key={lineId}
            grades={grades}
            colors={colors}
            networks={networks}
            fx={fx}
            onRemove={() => setLineIds((current) => current.filter((id) => id !== lineId))}
          />
        ))}
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>
    </div>
  );
}
