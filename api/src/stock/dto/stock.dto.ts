import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsNumber, IsString, ValidateNested } from "class-validator";

class StockBatchDto {
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  brand?: string | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsString()
  network?: string | null;

  @IsOptional()
  @IsString()
  grade?: string | null;

  @IsOptional()
  @IsNumber()
  costGbp?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imeis?: string[];

  // Number of units to add without a known IMEI yet. Only used for the
  // portion of the batch beyond however many real IMEIs were supplied —
  // e.g. imeis.length 2 + qty 5 creates 2 identified units and 3 blank ones.
  @IsOptional()
  @IsNumber()
  qty?: number;
}

export class UpdateStockUnitImeiDto {
  @IsString()
  imei: string;
}

export class ReceiveStockDto {
  @IsOptional()
  @IsString()
  supplierId?: string | null;

  @IsOptional()
  @IsString()
  purchaseOrderId?: string | null;

  @IsOptional()
  @IsBoolean()
  postLedger?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockBatchDto)
  batches: StockBatchDto[];
}

// Used by POST /purchase-orders/:id/receive — purchaseOrderId comes from the URL
// and postLedger is always forced on there, so neither is client-supplied.
export class ReceiveViaPurchaseOrderDto {
  @IsOptional()
  @IsString()
  supplierId?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockBatchDto)
  batches: StockBatchDto[];
}
