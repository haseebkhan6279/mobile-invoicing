"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerPicker, type CustomerHit } from "@/components/customer-picker";

type InvoiceOption = {
  id: string;
  invoiceNumber: string;
  customer: { id: string; name: string; clientId: string };
};

export function RmaCustomerInvoicePicker({
  invoices,
  selectedInvoiceId,
}: {
  invoices: InvoiceOption[];
  selectedInvoiceId?: string;
}) {
  const [customer, setCustomer] = useState<CustomerHit | null>(null);
  const customerInvoices = customer
    ? invoices.filter((invoice) => invoice.customer.id === customer.id)
    : [];

  return (
    <div className="space-y-4">
      <CustomerPicker name="rmaCustomerId" onSelect={setCustomer} />
      {customer ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Invoices for {customer.name}
          </p>
          {customerInvoices.length ? (
            <div className="flex flex-wrap gap-2">
              {customerInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/returns/new?invoiceId=${invoice.id}`}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    invoice.id === selectedInvoiceId
                      ? "border-[#0b3a6e] bg-[#0b3a6e] text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  }`}
                >
                  {invoice.invoiceNumber}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This customer has no invoices yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
