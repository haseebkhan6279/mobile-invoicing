import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RmaService } from "./rma.service";
import {
  AddRmaItemsDto,
  ApplyRmaCreditDto,
  CreateRmaDto,
  ProcessRmaDto,
  UpdateRmaDto,
  UpdateRmaItemDto,
} from "./dto/rma.dto";

@Controller("rma")
@UseGuards(JwtAuthGuard)
export class RmaController {
  constructor(private rma: RmaService) {}

  @Get()
  findAll(@Query("customerId") customerId?: string) {
    return this.rma.listRmas(customerId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.rma.getRma(id);
  }

  @Post()
  create(@Body() dto: CreateRmaDto) {
    return this.rma.createRma(dto);
  }

  @Patch(":id")
  process(@Param("id") id: string, @Body() dto: ProcessRmaDto) {
    return this.rma.processRma(id, dto.status);
  }

  @Patch(":id/details")
  update(@Param("id") id: string, @Body() dto: UpdateRmaDto) {
    return this.rma.updateRma(id, dto);
  }

  @Post(":id/items")
  addItems(@Param("id") id: string, @Body() dto: AddRmaItemsDto) {
    return this.rma.addRmaItems(id, dto);
  }

  @Patch(":id/items/:itemId")
  updateItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateRmaItemDto,
  ) {
    return this.rma.updateRmaItem(id, itemId, dto);
  }

  @Delete(":id/items/:itemId")
  removeItem(@Param("id") id: string, @Param("itemId") itemId: string) {
    return this.rma.removeRmaItem(id, itemId);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.rma.deleteRma(id);
  }

  @Post(":id/credit")
  @HttpCode(HttpStatus.OK)
  applyCredit(@Param("id") id: string, @Body() dto: ApplyRmaCreditDto) {
    return this.rma.applyRmaCredit(id, dto);
  }
}
