import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InvoicesService } from "./invoices.service";
import {
  CreateInvoiceDto,
  UpdateInvoiceLineDto,
  UpdateInvoiceLineImeisDto,
  UpdateInvoiceMarginVatDto,
  UpdateInvoiceShippingDto,
  UpdateInvoiceStatusDto,
} from "./dto/invoice.dto";

@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoices: InvoicesService) {}

  @Get()
  findAll(@Query("status") status?: string) {
    return this.invoices.listInvoices(status);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.invoices.getInvoice(id);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoices.createInvoice(dto);
  }

  @Patch(":id")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoices.updateInvoiceStatus(id, dto.status);
  }

  @Patch(":id/shipping")
  updateShipping(@Param("id") id: string, @Body() dto: UpdateInvoiceShippingDto) {
    return this.invoices.updateInvoiceShipping(id, dto);
  }

  @Patch(":id/margin-vat")
  updateMarginVat(@Param("id") id: string, @Body() dto: UpdateInvoiceMarginVatDto) {
    return this.invoices.updateInvoiceMarginVat(id, dto);
  }

  @Post(":id/lines")
  addLine(@Param("id") id: string, @Body() dto: UpdateInvoiceLineDto) {
    return this.invoices.addInvoiceLine(id, dto);
  }

  @Patch(":id/lines/:lineId")
  updateLine(
    @Param("id") id: string,
    @Param("lineId") lineId: string,
    @Body() dto: UpdateInvoiceLineDto,
  ) {
    return this.invoices.updateInvoiceLine(id, lineId, dto);
  }

  @Patch(":id/lines/:lineId/imeis")
  updateLineImeis(
    @Param("id") id: string,
    @Param("lineId") lineId: string,
    @Body() dto: UpdateInvoiceLineImeisDto,
  ) {
    return this.invoices.updateInvoiceLineImeis(id, lineId, dto.imeis);
  }
}
