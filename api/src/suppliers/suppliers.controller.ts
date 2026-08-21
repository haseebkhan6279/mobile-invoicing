import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SuppliersService } from "./suppliers.service";
import { LedgerEntryDto, SupplierDto } from "./dto/supplier.dto";

@Controller("suppliers")
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private suppliers: SuppliersService) {}

  @Get()
  findAll() {
    return this.suppliers.listSuppliers();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.suppliers.getSupplier(id);
  }

  @Post()
  create(@Body() dto: SupplierDto) {
    return this.suppliers.createSupplier(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: SupplierDto) {
    return this.suppliers.updateSupplier(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.suppliers.deleteSupplier(id);
  }

  @Post(":id/ledger")
  addLedgerEntry(@Param("id") id: string, @Body() dto: LedgerEntryDto) {
    return this.suppliers.addLedgerEntry(id, dto);
  }
}
