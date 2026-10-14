import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AttachmentsService } from "./attachments.service";
import { UploadAttachmentDto } from "./dto/attachment.dto";

// Same cap as purchase order attachments.
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

@Controller("attachments")
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private attachments: AttachmentsService) {}

  // Multipart: `file` plus either `invoiceId` or `rmaId`.
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  upload(@Body() dto: UploadAttachmentDto, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file provided");
    return this.attachments.addAttachment(
      { invoiceId: dto.invoiceId, rmaId: dto.rmaId },
      { filename: file.originalname, mimeType: file.mimetype, data: file.buffer },
    );
  }

  @Get(":id")
  async download(@Param("id") id: string, @Res() res: Response) {
    const attachment = await this.attachments.getAttachment(id);
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(attachment.filename)}"`,
    );
    res.send(Buffer.from(attachment.data));
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.attachments.removeAttachment(id);
  }
}
