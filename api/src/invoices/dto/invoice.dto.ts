import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { INVOICE_STATUSES } from "../../common/status";

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
  buyPriceGbp?: number;

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
  @IsNumber()
  @Min(0)
  shippingCostGbp?: number;

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

  @IsOptional()
  @IsBoolean()
  marginVatScheme?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  appliedRmaIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}

export class UpdateInvoiceStatusDto {
  @IsIn(INVOICE_STATUSES)
  status: string;
}

export class UpdateInvoiceShippingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCostGbp?: number;

  @IsOptional()
  @IsString()
  shippingLabel?: string | null;
}

export class UpdateInvoiceMarginVatDto {
  @IsBoolean()
  marginVatScheme: boolean;
}

export class UpdateInvoiceLineImeisDto {
  @IsArray()
  @IsString({ each: true })
  imeis: string[];
}

export class UpdateInvoiceLineDto {
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
  buyPriceGbp?: number;
}
