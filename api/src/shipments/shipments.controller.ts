import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ShipmentsService } from "./shipments.service";
import { CreateShipmentDto, UpdateShipmentDto } from "./dto/shipment.dto";

@Controller("shipments")
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
  constructor(private shipments: ShipmentsService) {}

  @Get()
  findAll() {
    return this.shipments.listShipments();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.shipments.getShipment(id);
  }

  @Post()
  create(@Body() dto: CreateShipmentDto) {
    return this.shipments.createShipment(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipments.updateShipment(id, dto);
  }
}
