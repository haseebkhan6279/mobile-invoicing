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
  @IsNumber()
  paymentAmountEur?: number;

  @IsOptional()
  @IsString()
  paymentDate?: string | null;
}
