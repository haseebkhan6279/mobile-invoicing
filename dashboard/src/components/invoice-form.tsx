"use client";

import { Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { getAvailableImeis } from "@/actions/stock";
import { getAvailableRmaCredits, type AvailableRmaCredit } from "@/actions/rma";
import { CustomerPicker, type CustomerHit } from "@/components/customer-picker";
import { InvoiceImeiEntriesField } from "@/components/invoice-imei-entries";
import { InvoiceImeiScanner, type ScannedStockUnit } from "@/components/invoice-imei-scanner";
import { InvoiceLineProductField, type ProductHit } from "@/components/invoice-line-product-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { GoodsNotReceivedWarning } from "@/components/goods-not-received-warning";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_GBP_TO_EUR_RATE, formatGbp, type PrintCurrency } from "@/lib/money";
import { rmaCreditSummary, rmaGoodsReceived } from "@/lib/rma";
import { labelStatus } from "@/lib/status";
import type { ImeiEntry } from "@/lib/imei-notes";

type Lookup = { id: string; name?: string; code?: string };

type LineSeed = {
  id: number;
  productName: string;
  color: string;
  network: string;
  grade: string;
  qty: number;
  buyPriceGbp: number;
  sellPriceGbp: string;
  supplierNote: string;
  imeiEntries: ImeiEntry[];
  supplierName: string | null;
};

const emptyLine = (id: number): LineSeed => ({
  id,
  productName: "",
  color: "Black",
  network: "Unlocked",
  grade: "A",
  qty: 1,
  buyPriceGbp: 0,
  sellPriceGbp: "",
  supplierNote: "",
  imeiEntries: [{ imei: "", notes: "" }],
  supplierName: null,
});

function lineSpec(line: Pick<LineSeed, "productName" | "color" | "network" | "grade">) {
  return `${line.productName.trim().toLowerCase()}|${line.color}|${line.network}|${line.grade}`;
}

function realImeis(entries: ImeiEntry[]) {
  return entries.map((entry) => entry.imei.trim()).filter(Boolean);
}

function InvoiceLine({
  line,
  grades,
  colors,
  networks,
  canRemove,
  onChange,
  onRemove,
}: {
  line: LineSeed;
  grades: Lookup[];
  colors: Lookup[];
  networks: Lookup[];
  canRemove: boolean;
  onChange: (patch: Partial<LineSeed>) => void;
  onRemove: () => void;
}) {
  const uid = useId();

  const handleSelect = async (hit: ProductHit) => {
    const qty = Math.max(1, line.qty || 1);
    const imeiList = await getAvailableImeis({
      productName: hit.productName,
      color: hit.color,
      network: hit.network,
      grade: hit.grade,
    });
    onChange({
      productName: hit.productName,
      supplierName: hit.supplierName,
      color: hit.color,
      network: hit.network,
      grade: hit.grade,
      buyPriceGbp: hit.costGbp,
      supplierNote: hit.supplierName ?? line.supplierNote,
      imeiEntries: imeiList.slice(0, qty).map((unit) => ({
        imei: unit.imei,
        notes: (unit.notes ?? "").trim() || unit.supplierName || "",
      })),
    });
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Line item</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-slate-300 dark:text-red-400 dark:hover:bg-red-950/40"
          aria-label="Remove line item"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 lg:grid-cols-[1.6fr_0.9fr_0.9fr_0.55fr_0.5fr_0.85fr_0.85fr] lg:gap-y-1.5">
        <div className="col-span-2 sm:col-span-4 lg:col-span-1">
          <Label className="mb-1">Product name</Label>
          <InvoiceLineProductField
            value={line.productName}
            onChange={(next) => onChange({ productName: next, supplierName: null })}
            onSelect={handleSelect}
          />
        </div>
        <div>
          <Label className="mb-1">Color</Label>
          <Input
            name="lineColor"
            list={`${uid}-colors`}
            value={line.color}
            onChange={(event) => onChange({ color: event.target.value })}
          />
          <datalist id={`${uid}-colors`}>
            {colors.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label className="mb-1">Network</Label>
          <Input
            name="lineNetwork"
            list={`${uid}-networks`}
            value={line.network}
            onChange={(event) => onChange({ network: event.target.value })}
          />
          <datalist id={`${uid}-networks`}>
            {networks.map((n) => (
              <option key={n.id} value={n.name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label className="mb-1">Grade</Label>
          <Input
            name="lineGrade"
            list={`${uid}-grades`}
            value={line.grade}
            onChange={(event) => onChange({ grade: event.target.value })}
          />
          <datalist id={`${uid}-grades`}>
            {grades.map((g) => (
              <option key={g.id} value={g.code} />
            ))}
          </datalist>
        </div>
        <div>
          <Label className="mb-1">Qty</Label>
          <Input
            name="lineQty"
            type="number"
            min={1}
            value={line.qty}
            onChange={(event) => onChange({ qty: Math.max(1, Number(event.target.value) || 1) })}
          />
        </div>
        <div>
          <Label className="mb-1">Buy £</Label>
          <Input
            name="lineBuyPriceGbp"
            type="number"
            step="0.01"
            value={line.buyPriceGbp}
            onChange={(event) => onChange({ buyPriceGbp: Number(event.target.value) || 0 })}
          />
        </div>
        <div>
          <Label className="mb-1">Sell £</Label>
          <Input
            name="linePriceGbp"
            type="number"
            step="0.01"
            value={line.sellPriceGbp}
            onChange={(event) => onChange({ sellPriceGbp: event.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <Label className="mb-1">Notes / supplier</Label>
          <Input
            name="lineSupplierNote"
            value={line.supplierNote}
            onChange={(event) => onChange({ supplierNote: event.target.value })}
            placeholder="Vendor, source, or other internal note"
          />
        </div>
      </div>
      <InvoiceImeiEntriesField
        value={line.imeiEntries}
        onChange={(imeiEntries) => {
          const count = realImeis(imeiEntries).length;
          onChange({ imeiEntries, qty: Math.max(line.qty, count || 1) });
        }}
      />
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {line.supplierName ? (
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Purchased from {line.supplierName} (internal only, not printed on invoice).{" "}
          </span>
        ) : null}
        Buying price and supplier notes are internal only and never appear on the printed invoice.
      </p>
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
  const [lines, setLines] = useState<LineSeed[]>([emptyLine(0)]);
  const [credits, setCredits] = useState<AvailableRmaCredit[]>([]);
  const [selectedCreditIds, setSelectedCreditIds] = useState<string[]>([]);
  const [installmentPlanEnabled, setInstallmentPlanEnabled] = useState(false);
  const [printCurrency, setPrintCurrency] = useState<PrintCurrency>("GBP");

  const goodsTotal = lines.reduce(
    (sum, line) => sum + line.qty * (Number(line.sellPriceGbp) || 0),
    0,
  );

  const applyScan = (unit: ScannedStockUnit): string | null => {
    const imei = (unit.imei ?? "").trim();
    if (!imei) return "That stock unit has no IMEI yet.";
    if (unit.status !== "IN_STOCK") {
      const onInvoice = unit.invoiceNumber ? ` (invoice ${unit.invoiceNumber})` : "";
      return `${imei} is ${labelStatus(unit.status).toLowerCase()}${onInvoice} — not available to add.`;
    }
    if (lines.some((line) => realImeis(line.imeiEntries).includes(imei))) {
      return `${imei} is already on this invoice.`;
    }

    const note = (unit.notes ?? "").trim() || unit.supplierName || "";
    const incoming = {
      productName: unit.productName,
      color: unit.color,
      network: unit.network,
      grade: unit.grade,
    };
    const spec = lineSpec(incoming);

    setLines((current) => {
      const duplicate = current.some((line) => realImeis(line.imeiEntries).includes(imei));
      if (duplicate) return current;

      const matchIndex = current.findIndex(
        (line) => line.productName.trim() && lineSpec(line) === spec,
      );
      if (matchIndex >= 0) {
        return current.map((line, index) => {
          if (index !== matchIndex) return line;
          const imeiEntries = [
            ...line.imeiEntries.filter((entry) => entry.imei.trim()),
            { imei, notes: note },
          ];
          return {
            ...line,
            imeiEntries,
            qty: Math.max(line.qty, imeiEntries.length),
          };
        });
      }

      const blankIndex = current.findIndex(
        (line) => !line.productName.trim() && realImeis(line.imeiEntries).length === 0,
      );
      const nextLine: LineSeed = {
        ...(blankIndex >= 0 ? current[blankIndex] : emptyLine(nextLineId.current++)),
        productName: unit.productName,
        color: unit.color,
        network: unit.network,
        grade: unit.grade,
        qty: 1,
        buyPriceGbp: unit.costGbp,
        supplierNote: unit.supplierName ?? "",
        supplierName: unit.supplierName,
        imeiEntries: [{ imei, notes: note }],
      };
      if (blankIndex >= 0) {
        return current.map((line, index) => (index === blankIndex ? nextLine : line));
      }
      return [...current, nextLine];
    });
    return null;
  };

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
        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <h2 className="font-medium">Available credit notes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tick a credit note to apply it to this invoice. The full balance is applied by
            default — lower the amount to apply only part of it and leave the rest for a later
            invoice.
          </p>
          {credits.map((credit) => {
            const { totalGbp, appliedGbp, remainingGbp } = rmaCreditSummary(credit);
            const checked = selectedCreditIds.includes(credit.id);
            return (
              <div
                key={credit.id}
                className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3 first:border-0 first:pt-0 dark:border-slate-800"
              >
                <label className="flex items-center gap-2 text-sm">
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
                  <span>
                    {credit.rmaNumber} · from Invoice {credit.invoice.invoiceNumber}
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {formatGbp(totalGbp)} total · {formatGbp(appliedGbp)} applied ·{" "}
                      {formatGbp(remainingGbp)} remaining
                    </span>
                    {rmaGoodsReceived(credit) ? null : (
                      <GoodsNotReceivedWarning />
                    )}
                  </span>
                </label>
                {checked ? (
                  <div>
                    <Label htmlFor={`credit-amount-${credit.id}`}>Amount to apply £</Label>
                    <Input
                      id={`credit-amount-${credit.id}`}
                      name={`appliedRmaAmount-${credit.id}`}
                      type="number"
                      step="0.01"
                      min={0.01}
                      max={remainingGbp}
                      defaultValue={remainingGbp}
                      className="w-40"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium">Invoice currency</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="printCurrency">Issue this invoice in</Label>
            <Select
              id="printCurrency"
              name="printCurrency"
              value={printCurrency}
              onChange={(event) => setPrintCurrency(event.target.value as PrintCurrency)}
            >
              <option value="GBP">GBP — £ (Echo Logic Tech LTD)</option>
              <option value="EUR">EUR — € (Atlantic Devices Solutions LTD)</option>
            </Select>
          </div>
          {printCurrency === "EUR" ? (
            <div>
              <Label htmlFor="fxRate">Exchange rate (1 GBP = ? EUR)</Label>
              <Input
                id="fxRate"
                name="fxRate"
                type="number"
                step="0.0001"
                min={0.0001}
                defaultValue={DEFAULT_GBP_TO_EUR_RATE}
              />
            </div>
          ) : null}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {printCurrency === "EUR"
            ? "Prices below are still entered in GBP. The printed invoice is issued by Atlantic Devices Solutions LTD (Belfast), shows the Wise EUR account, and converts every amount at the rate above."
            : "The printed invoice is issued by Echo Logic Tech LTD (51-B Deptford High Street, SE8 4AD) and shows its Tide account for payment."}
        </p>
      </div>

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

      <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-medium">Payment</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="initialPaymentGbp">Payment received now (£)</Label>
            <Input
              id="initialPaymentGbp"
              name="initialPaymentGbp"
              type="number"
              step="0.01"
              min={0}
              defaultValue="0"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="installmentPlanEnabled"
            checked={installmentPlanEnabled}
            onChange={(event) => setInstallmentPlanEnabled(event.target.checked)}
            className="rounded"
          />
          Split the remaining balance into installments
        </label>

        {installmentPlanEnabled ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="installmentCount">Number of installments</Label>
              <Input
                id="installmentCount"
                name="installmentCount"
                type="number"
                min={2}
                defaultValue={3}
              />
            </div>
            <div>
              <Label htmlFor="installmentStartDate">First due date</Label>
              <Input id="installmentStartDate" name="installmentStartDate" type="date" />
            </div>
            <div>
              <Label htmlFor="installmentIntervalDays">Days between installments</Label>
              <Input
                id="installmentIntervalDays"
                name="installmentIntervalDays"
                type="number"
                min={1}
                defaultValue={30}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 sm:col-span-3">
              The remaining balance after the payment above is split evenly across these
              installments, starting on the due date given (defaults to today).
            </p>
          </div>
        ) : null}
      </div>

      <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <input
          type="checkbox"
          name="marginVatScheme"
          defaultChecked
          className="mt-0.5 rounded"
        />
        <span>
          <span className="font-medium">Margin VAT Scheme</span> — stock on this invoice is sold
          under the VAT margin scheme. This will be shown prominently on the printed invoice.
          Uncheck if this sale is not under the margin scheme.
        </span>
      </label>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-medium">Invoice lines</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Goods total {formatGbp(goodsTotal)}
          </p>
        </div>
        <InvoiceImeiScanner onScan={applyScan} />
        {lines.map((line) => (
          <InvoiceLine
            key={line.id}
            line={line}
            grades={grades}
            colors={colors}
            networks={networks}
            canRemove={lines.length > 1}
            onChange={(patch) =>
              setLines((current) =>
                current.map((row) => (row.id === line.id ? { ...row, ...patch } : row)),
              )
            }
            onRemove={() => setLines((current) => current.filter((row) => row.id !== line.id))}
          />
        ))}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLines((current) => [...current, emptyLine(nextLineId.current++)])}
          >
            Add line
          </Button>
        </div>
      </div>
      <div>
        <h2 className="font-medium">Internal notes</h2>
        <p className="mt-1 mb-3 text-sm text-slate-500 dark:text-slate-400">
          Admin only — never printed on the invoice or included in the emailed copy. Use it for
          anything the customer should not see.
        </p>
        <Label htmlFor="notes" className="sr-only">
          Internal notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Chased twice on WhatsApp / collecting in person Friday…"
        />
      </div>
    </div>
  );
}
