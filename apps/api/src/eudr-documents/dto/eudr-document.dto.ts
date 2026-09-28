import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';

export enum EUDRDocStatus {
  BORRADOR = 'BORRADOR',
  GENERADO = 'GENERADO',
  VALIDADO = 'VALIDADO',
  RECHAZADO = 'RECHAZADO',
}

export class CreateEUDRDocumentDto {
  @IsString()
  shipmentId: string;

  @IsOptional()
  @IsString()
  lotId?: string;

  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;

  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @IsOptional()
  @IsString()
  deforestationEvidence?: string;

  @IsOptional()
  @IsString()
  declarationText?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEUDRDocumentDto {
  @IsOptional()
  @IsEnum(EUDRDocStatus)
  status?: EUDRDocStatus;

  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;

  @IsOptional()
  @IsDateString()
  harvestDate?: string;

  @IsOptional()
  @IsString()
  deforestationEvidence?: string;

  @IsOptional()
  @IsString()
  declarationText?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
