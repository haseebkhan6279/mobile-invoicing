"use client";

import { useState } from "react";
import { updateInvoiceIssue } from "@/actions/invoices";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { BankAccountId, IssuingEntityId } from "@/lib/company";
import { DEFAULT_GBP_TO_EUR_RATE, type PrintCurrency } from "@/lib/money";

export function InvoiceIssueForm({
  invoiceId,
  issuingEntity: initialEntity,
  printCurrency: initialCurrency,
  bankAccount: initialBank,
  fxRate: initialRate,
}: {
  invoiceId: string;
  issuingEntity?: string | null;
  printCurrency?: string | null;
  bankAccount?: string | null;
  fxRate?: number | null;
}) {
  const [issuingEntity, setIssuingEntity] = useState<IssuingEntityId>(
    initialEntity === "ATLANTIC" ? "ATLANTIC" : "ECHO",
  );
  const [printCurrency, setPrintCurrency] = useState<PrintCurrency>(
    initialCurrency === "EUR" ? "EUR" : "GBP",
  );
  const [bankAccount, setBankAccount] = useState<BankAccountId>(
    initialBank === "EUR" ? "EUR" : "GBP",
  );
  const [fxRate, setFxRate] = useState(
    initialRate && initialRate > 0 ? initialRate : DEFAULT_GBP_TO_EUR_RATE,
  );

  return (
    <form action={updateInvoiceIssue} className="space-y-4">
      <input type="hidden" name="id" value={invoiceId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="issuingEntity">Issuer / company</Label>
          <Select
            id="issuingEntity"
            name="issuingEntity"
            value={issuingEntity}
            onChange={(event) => setIssuingEntity(event.target.value as IssuingEntityId)}
          >
            <option value="ECHO">Echo Logic Tech LTD</option>
            <option value="ATLANTIC">Atlantic Devices Solutions LTD</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="printCurrency">Currency</Label>
          <Select
            id="printCurrency"
            name="printCurrency"
            value={printCurrency}
            onChange={(event) => {
              const currency = event.target.value as PrintCurrency;
              setPrintCurrency(currency);
              setBankAccount(currency);
            }}
          >
            <option value="GBP">GBP — £ Pounds</option>
            <option value="EUR">EUR — € Euros</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="bankAccount">Bank account</Label>
          <Select
            id="bankAccount"
            name="bankAccount"
            value={bankAccount}
            onChange={(event) => setBankAccount(event.target.value as BankAccountId)}
          >
            <option value="GBP">GBP — Zempler (Echo Logic)</option>
            <option value="EUR">EUR — Wise (Atlantic)</option>
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
              value={fxRate}
              onChange={(event) => setFxRate(Number(event.target.value) || DEFAULT_GBP_TO_EUR_RATE)}
            />
          </div>
        ) : null}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Changing currency updates printed totals and switches the bank block to the matching
        account. You can still pick the other bank. Invoice number is not changed.
      </p>
      <SubmitButton pendingText="Saving…">Save header</SubmitButton>
    </form>
  );
}
