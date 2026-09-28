import { IsString, IsOptional, IsEnum } from "class-validator";

export class CreateFarmCertificateDto {
  @IsString()
  sellerProfileId: string;

  @IsEnum([
    "FINCA_ORGANICO",
    "FINCA_FAIR_TRADE",
    "FINCA_RAINFOREST",
    "FINCA_EUDR",
    "FINCA_SOSTENIBILIDAD",
    "FINCA_CAPACIDAD",
  ] as const)
  type: string;

  @IsString()
  number: string;

  @IsString()
  issuer: string;

  @IsString()
  issuedAt: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFarmCertificateDto {
  @IsEnum([
    "FINCA_ORGANICO",
    "FINCA_FAIR_TRADE",
    "FINCA_RAINFOREST",
    "FINCA_EUDR",
    "FINCA_SOSTENIBILIDAD",
    "FINCA_CAPACIDAD",
  ] as const)
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  issuer?: string;

  @IsString()
  @IsOptional()
  issuedAt?: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
