import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderMetaDto } from "./dto/purchase-order.dto";
import { StockService } from "../stock/stock.service";
import { ReceiveViaPurchaseOrderDto } from "../stock/dto/stock.dto";

// Kept well under Vercel's serverless function request-body cap.
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

@Controller("purchase-orders")
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(
    private purchaseOrders: PurchaseOrdersService,
    private stock: StockService,
  ) {}

  @Get()
  findAll() {
    return this.purchaseOrders.listPurchaseOrders();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.purchaseOrders.getPurchaseOrder(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrders.createPurchaseOrder(dto);
  }

  @Patch(":id")
  updateMeta(@Param("id") id: string, @Body() dto: UpdatePurchaseOrderMetaDto) {
    return this.purchaseOrders.updatePurchaseOrderMeta(id, dto);
  }

  // Mirrors receivePurchaseOrder in the dashboard's server actions: receiving
  // against a PO always posts to the supplier ledger.
  @Post(":id/receive")
  receive(@Param("id") id: string, @Body() dto: ReceiveViaPurchaseOrderDto) {
    return this.stock.receiveStockBatches({ ...dto, purchaseOrderId: id, postLedger: true });
  }

  @Post(":id/attachment")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  uploadAttachment(@Param("id") id: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file provided");
    return this.purchaseOrders.setAttachment(id, {
      filename: file.originalname,
      mimeType: file.mimetype,
      data: file.buffer,
    });
  }

  @Delete(":id/attachment")
  deleteAttachment(@Param("id") id: string) {
    return this.purchaseOrders.removeAttachment(id);
  }

  @Get(":id/attachment")
  async downloadAttachment(@Param("id") id: string, @Res() res: Response) {
    const attachment = await this.purchaseOrders.getAttachment(id);
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(attachment.filename)}"`,
    );
    res.send(Buffer.from(attachment.data));
  }
}
