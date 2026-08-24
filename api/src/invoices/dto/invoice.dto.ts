import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { INVOICE_ENTITIES, INVOICE_STATUSES } from "../../common/status";

class InvoiceLineDto {
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
  unitPriceGbp?: number;

  @IsOptional()
  @IsNumber()
  unitPriceEur?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imeis?: string[];
}

export class CreateInvoiceDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsIn(INVOICE_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(INVOICE_ENTITIES)
  entity?: string;

  @IsOptional()
  @IsNumber()
  fxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCostGbp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCostEur?: number;

  @IsOptional()
  @IsString()
  shippingLabel?: string | null;

  @IsOptional()
  @IsString()
  paymentTerms?: string | null;

  @IsOptional()
  @IsString()
  warrantyTerms?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}

export class UpdateInvoiceStatusDto {
  @IsIn(INVOICE_STATUSES)
  status: string;
}

export class UpdateInvoiceLineImeisDto {
  @IsArray()
  @IsString({ each: true })
  imeis: string[];
}
