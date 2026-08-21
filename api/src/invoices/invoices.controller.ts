import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from "./dto/invoice.dto";

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
}
