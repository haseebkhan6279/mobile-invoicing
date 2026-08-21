import { IsOptional, IsString } from "class-validator";

export class CustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  businessName?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  vatNumber?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  shippingAddress?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
