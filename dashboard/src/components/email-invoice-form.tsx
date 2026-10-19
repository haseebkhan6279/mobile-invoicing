import { sendInvoiceEmail } from "@/actions/invoices";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatFileSize, type AttachmentSummary } from "@/lib/attachments";
import type { PrintCurrency } from "@/lib/money";

export function EmailInvoiceForm({
  invoiceId,
  customerEmail,
  returnTo,
  currency = "GBP",
  rate,
  attachments = [],
}: {
  invoiceId: string;
  customerEmail: string | null;
  returnTo: string;
  /** Currency the attached PDF is rendered in — mirrors the print-currency picker. */
  currency?: PrintCurrency;
  rate?: number;
  /** The invoice's files; each ticked one is sent with the PDF. */
  attachments?: AttachmentSummary[];
}) {
  return (
    <form action={sendInvoiceEmail} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={invoiceId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="currency" value={currency} />
      {currency === "EUR" && rate ? <input type="hidden" name="rate" value={rate} /> : null}
      <div className="flex items-end gap-2">
        <div>
          <Input
            name="email"
            type="email"
            required
            defaultValue={customerEmail ?? ""}
            placeholder="customer@example.com"
            className="h-10 w-56"
          />
        </div>
        <SubmitButton pendingText="Sending…" size="md" variant="secondary">
          {currency === "EUR" ? "Email invoice (EUR)" : "Email invoice"}
        </SubmitButton>
      </div>
      {attachments.length ? (
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-gray-400">
          <legend className="sr-only">Attachments to send</legend>
          <span className="text-xs uppercase tracking-wide text-slate-500">Also attach</span>
          {attachments.map((file) => (
            <label key={file.id} className="inline-flex items-center gap-1.5">
              <input type="checkbox" name="attachmentIds" value={file.id} defaultChecked />
              <span className="max-w-[16rem] truncate">{file.filename}</span>
              <span className="text-xs text-slate-400">({formatFileSize(file.size)})</span>
            </label>
          ))}
        </fieldset>
      ) : null}
    </form>
  );
}
