import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CustomersService } from "./customers.service";
import { CustomerDto } from "./dto/customer.dto";

@Controller("customers")
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get()
  findAll(@Query("q") q?: string) {
    return q ? this.customers.searchCustomers(q) : this.customers.listCustomers();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.customers.getCustomer(id);
  }

  @Post()
  create(@Body() dto: CustomerDto) {
    return this.customers.createCustomer(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: CustomerDto) {
    return this.customers.updateCustomer(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.customers.deleteCustomer(id);
  }
}
