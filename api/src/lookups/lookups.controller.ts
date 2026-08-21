import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LookupsService } from "./lookups.service";

@Controller("lookups")
@UseGuards(JwtAuthGuard)
export class LookupsController {
  constructor(private lookups: LookupsService) {}

  @Get()
  getLookups() {
    return this.lookups.getLookups();
  }
}
