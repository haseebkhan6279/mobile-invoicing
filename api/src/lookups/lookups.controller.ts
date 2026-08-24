import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LookupsService } from "./lookups.service";
import { CreateColorDto, CreateGradeDto } from "./dto/lookups.dto";

@Controller("lookups")
@UseGuards(JwtAuthGuard)
export class LookupsController {
  constructor(private lookups: LookupsService) {}

  @Get()
  getLookups() {
    return this.lookups.getLookups();
  }

  @Post("colors")
  createColor(@Body() dto: CreateColorDto) {
    return this.lookups.createColor(dto);
  }

  @Delete("colors/:id")
  deleteColor(@Param("id") id: string) {
    return this.lookups.deleteColor(id);
  }

  @Post("grades")
  createGrade(@Body() dto: CreateGradeDto) {
    return this.lookups.createGrade(dto);
  }

  @Delete("grades/:id")
  deleteGrade(@Param("id") id: string) {
    return this.lookups.deleteGrade(id);
  }
}
