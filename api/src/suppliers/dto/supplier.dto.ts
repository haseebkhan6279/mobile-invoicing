import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { LEDGER_TYPES } from "../../common/status";

export class SupplierDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  vatNumber?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class LedgerEntryDto {
  @IsOptional()
  @IsIn(LEDGER_TYPES)
  type?: string;

  @IsNumber()
  amountGbp: number;

  @IsOptional()
  @IsString()
  date?: string | null;

  @IsOptional()
  @IsString()
  reference?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
