import { Type } from "class-transformer";
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { RMA_ACTIONS, RMA_PAYMENT_TYPES, RMA_STATUSES } from "../../common/status";

class RmaItemDto {
  @IsString()
  stockUnitId: string;

  @IsOptional()
  @IsIn(RMA_ACTIONS)
  action?: string;

  @IsOptional()
  @IsString()
  reason?: string | null;
}

class RmaManualItemDto {
  @IsOptional()
  @IsString()
  invoiceNumber?: string | null;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  imei?: string | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsString()
  grade?: string | null;

  @IsOptional()
  @IsIn(RMA_ACTIONS)
  action?: string;

  @IsOptional()
  @IsNumber()
  unitPriceGbp?: number;

  @IsOptional()
  @IsString()
  reason?: string | null;
}

export class CreateRmaDto {
  @IsString()
  invoiceId: string;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RmaItemDto)
  items: RmaItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RmaManualItemDto)
  manualItems?: RmaManualItemDto[];
}

export class ProcessRmaDto {
  @IsIn(RMA_STATUSES)
  status: string;
}

export class ApplyRmaCreditDto {
  @IsOptional()
  @IsIn(RMA_PAYMENT_TYPES)
  paymentType?: string;

  @IsOptional()
  @IsString()
  appliedInvoiceId?: string | null;

  @IsOptional()
  @IsNumber()
  paymentAmountGbp?: number;

  @IsOptional()
  @IsString()
  paymentDate?: string | null;
}

export class UpdateRmaDto {
  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class AddRmaItemsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RmaItemDto)
  items?: RmaItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RmaManualItemDto)
  manualItems?: RmaManualItemDto[];
}

// Product, IMEI, colour and grade only apply to manual items — a tracked unit's
// details come from its stock record and are ignored here.
export class UpdateRmaItemDto {
  @IsOptional()
  @IsString()
  invoiceNumber?: string | null;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  imei?: string | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsString()
  grade?: string | null;

  @IsOptional()
  @IsIn(RMA_ACTIONS)
  action?: string;

  @IsOptional()
  @IsNumber()
  unitPriceGbp?: number;

  @IsOptional()
  @IsString()
  reason?: string | null;
}
