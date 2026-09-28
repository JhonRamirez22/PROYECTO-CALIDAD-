import { IsOptional, IsString, IsDateString, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { CertificateType } from "@prisma/client";

export class CreateCertificateDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() lotId?: string;
  @IsOptional() @IsString() shipmentId?: string;
  @IsEnum(CertificateType) type: CertificateType;
  @IsString() number: string;
  @IsString() issuer: string;
  @IsOptional() @IsString() documentFormat?: string;
  @IsOptional() @IsString() countryOfOrigin?: string;
  @IsDateString() issuedAt: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateCertificateDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() lotId?: string;
  @IsOptional() @IsString() shipmentId?: string;
  @IsOptional() @IsEnum(CertificateType) type?: CertificateType;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() issuer?: string;
  @IsOptional() @IsString() documentFormat?: string;
  @IsOptional() @IsString() countryOfOrigin?: string;
  @IsOptional() @IsDateString() issuedAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CertificateFilterDto {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() lotId?: string;
  @IsOptional() @IsString() shipmentId?: string;
  @IsOptional() @IsEnum(CertificateType) type?: CertificateType;
  // Días hacia adelante para alertas de vencimiento (ej. 30)
  @IsOptional()
  @Type(() => Number)
  expiringInDays?: number;
  @IsOptional() @IsDateString() issuedFrom?: string;
  @IsOptional() @IsDateString() issuedTo?: string;
  @IsOptional() @IsEnum(["VIGENTE", "POR_VENCER", "VENCIDO"]) status?: string;
}
