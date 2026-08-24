import { IsInt, IsOptional, IsString, MinLength } from "class-validator";

export class CreateColorDto {
  @IsString()
  @MinLength(1)
  name: string;
}

export class CreateGradeDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(1)
  label: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
