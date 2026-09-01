import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StockService } from "./stock.service";
import { ReceiveStockDto, UpdateStockUnitDto, UpdateStockUnitImeiDto } from "./dto/stock.dto";

@Controller("stock")
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private stock: StockService) {}

  @Get()
  findAll(@Query("status") status?: string, @Query("grade") grade?: string, @Query("q") q?: string) {
    return this.stock.listStock({ status, grade, q });
  }

  @Post()
  receive(@Body() dto: ReceiveStockDto) {
    return this.stock.receiveStockBatches(dto);
  }

  @Patch(":id/imei")
  updateImei(@Param("id") id: string, @Body() dto: UpdateStockUnitImeiDto) {
    return this.stock.updateStockUnitImei(id, dto.imei);
  }

  // Used by the dashboard's invoice line builder (typeahead IMEI picker).
  @Get("available-imeis")
  availableImeis(
    @Query("productName") productName = "",
    @Query("color") color = "",
    @Query("network") network = "",
    @Query("grade") grade = "",
    @Query("limit") limit?: string,
  ) {
    return this.stock.getAvailableImeis(
      { productName, color, network, grade },
      limit ? Number(limit) : undefined,
    );
  }

  // Used by the dashboard's invoice line builder (product name typeahead).
  @Get("search-products")
  searchProducts(@Query("q") q = "") {
    return this.stock.searchStockProducts(q);
  }

  // Declared after the literal routes above (available-imeis, search-products)
  // so ":id" doesn't shadow them.
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.stock.getStockUnit(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateStockUnitDto) {
    return this.stock.updateStockUnit(id, dto);
  }
}
