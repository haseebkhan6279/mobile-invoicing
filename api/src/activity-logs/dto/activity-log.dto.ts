import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const ACTIVITY_TYPES = ["LOGIN", "PAGE", "ACTION", "ERROR"] as const;

export class CreateActivityLogDto {
  @IsIn(ACTIVITY_TYPES)
  type: (typeof ACTIVITY_TYPES)[number];

  @IsString()
  path: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  method?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number | null;

  @IsOptional()
  @IsString()
  message?: string | null;
}

export class ListActivityLogsDto {
  @IsOptional()
  @IsIn(ACTIVITY_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;
}
