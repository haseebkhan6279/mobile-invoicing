import { Type } from "class-transformer";
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { PO_STATUSES } from "../../common/status";

export class PoLineDto {
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsString()
  network?: string | null;

  @IsOptional()
  @IsString()
  grade?: string | null;

  @IsNumber()
  qty: number;

  @IsOptional()
  @IsNumber()
  unitCostGbp?: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsIn(PO_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCostGbp?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoLineDto)
  lines: PoLineDto[];
}

export class UpdatePurchaseOrderMetaDto {
  @IsOptional()
  @IsIn(PO_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCostGbp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCostGbp?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoLineDto)
  lines?: PoLineDto[];
}
