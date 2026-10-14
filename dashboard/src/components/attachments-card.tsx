import { addAttachments, removeAttachment } from "@/actions/attachments";
import { ATTACHMENT_ACCEPT } from "@/components/attachments-field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatFileSize, type AttachmentOwner, type AttachmentSummary } from "@/lib/attachments";
import { formatDate } from "@/lib/utils";

/** Lists the files on an invoice or RMA, with upload and remove. */
export function AttachmentsCard({
  owner,
  attachments,
}: {
  owner: AttachmentOwner;
  attachments: AttachmentSummary[];
}) {
  const ownerInputs = Object.entries(owner).map(([key, value]) => (
    <input key={key} type="hidden" name={key} value={value} />
  ));

  return (
    <Card className="no-print">
      <h2 className="mb-3 font-medium">Attachments</h2>
      {attachments.length ? (
        <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex flex-wrap items-center gap-3 py-2">
              <a
                href={`/attachments/${attachment.id}`}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 break-all text-brand-500 hover:underline dark:text-sky-400"
              >
                {attachment.filename}
              </a>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(attachment.size)} · {formatDate(attachment.createdAt)}
              </span>
              <form action={removeAttachment} className="ml-auto">
                {ownerInputs}
                <input type="hidden" name="attachmentId" value={attachment.id} />
                <SubmitButton pendingText="Removing…" size="sm" variant="ghost">
                  Remove
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">No files attached yet.</p>
      )}
      <form action={addAttachments} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {ownerInputs}
        <Input
          name="attachments"
          type="file"
          multiple
          required
          accept={ATTACHMENT_ACCEPT}
          className="sm:flex-1"
        />
        <SubmitButton pendingText="Uploading…" size="sm">
          Attach
        </SubmitButton>
      </form>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        PDF or image, up to 4MB each. You can pick several at once.
      </p>
    </Card>
  );
}
