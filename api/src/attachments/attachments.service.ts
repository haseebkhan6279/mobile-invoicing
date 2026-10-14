import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type AttachmentOwner = { invoiceId?: string; rmaId?: string };

// Everything but the file bytes, for listing attachments on a page.
export const ATTACHMENT_SUMMARY = {
  id: true,
  filename: true,
  mimeType: true,
  size: true,
  createdAt: true,
} as const;

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async addAttachment(
    owner: AttachmentOwner,
    file: { filename: string; mimeType: string; data: Buffer },
  ) {
    const invoiceId = owner.invoiceId || undefined;
    const rmaId = owner.rmaId || undefined;
    if (!invoiceId === !rmaId) {
      throw new BadRequestException("Attach the file to either an invoice or an RMA");
    }
    if (invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new NotFoundException("Invoice not found");
    }
    if (rmaId) {
      const rma = await this.prisma.rma.findUnique({ where: { id: rmaId } });
      if (!rma) throw new NotFoundException("RMA not found");
    }

    return this.prisma.attachment.create({
      data: {
        invoiceId,
        rmaId,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.data.length,
        data: new Uint8Array(file.data),
      },
      select: ATTACHMENT_SUMMARY,
    });
  }

  async getAttachment(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException("Attachment not found");
    return attachment;
  }

  async removeAttachment(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      select: { id: true, invoiceId: true, rmaId: true },
    });
    if (!attachment) throw new NotFoundException("Attachment not found");
    await this.prisma.attachment.delete({ where: { id } });
    return { deleted: true, invoiceId: attachment.invoiceId, rmaId: attachment.rmaId };
  }
}
