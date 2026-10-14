import { IsOptional, IsString } from "class-validator";

export class UploadAttachmentDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsString()
  rmaId?: string;
}
