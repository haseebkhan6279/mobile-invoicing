import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ActivityLogsController } from "./activity-logs.controller";
import { ActivityLogsService } from "./activity-logs.service";
import { ActivityLogInterceptor } from "./activity-log.interceptor";

@Module({
  controllers: [ActivityLogsController],
  providers: [
    ActivityLogsService,
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
