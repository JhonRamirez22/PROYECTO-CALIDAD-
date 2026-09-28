import { IsString, IsEnum, IsOptional, IsDateString, IsObject } from "class-validator";

export class CreateDocumentDto {
  @IsString()
  orderId: string;

  @IsEnum(["ORIGEN", "FITOSANITARIO", "EUDR", "CALIDAD", "COMERCIAL"])
  type: string;

  @IsString()
  number: string;

  @IsString()
  @IsOptional()
  issuedBy?: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDocumentDto {
  @IsEnum(["BORRADOR", "GENERADO", "VALIDADO", "RECHAZADO"])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  issuedBy?: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
