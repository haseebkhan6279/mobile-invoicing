import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SearchService } from "./search.service";

@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private search: SearchService) {}

  @Get()
  globalSearch(@Query("q") q = "") {
    return this.search.globalSearch(q);
  }
}
