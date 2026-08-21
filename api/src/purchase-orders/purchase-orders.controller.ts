import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { CreatePurchaseOrderDto, UpdatePurchaseOrderMetaDto } from "./dto/purchase-order.dto";
import { StockService } from "../stock/stock.service";
import { ReceiveViaPurchaseOrderDto } from "../stock/dto/stock.dto";

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
}
