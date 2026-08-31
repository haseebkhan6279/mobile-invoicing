import { IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { SHIPMENT_STATUSES } from "../../common/status";

export class CreateShipmentDto {
  @IsString()
  invoiceId: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string | null;

  @IsOptional()
  @IsString()
  carrier?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCostGbp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCostGbp?: number;

  @IsOptional()
  @IsIn(SHIPMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  trackingNumber?: string | null;

  @IsOptional()
  @IsString()
  carrier?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCostGbp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCostGbp?: number;

  @IsOptional()
  @IsIn(SHIPMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
