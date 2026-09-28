import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum CustomsDocType {
  DUA = 'DUA',
  SAD = 'SAD',
}

export enum CustomsDocStatus {
  BORRADOR = 'BORRADOR',
  GENERADO = 'GENERADO',
  PRESENTADO = 'PRESENTADO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export class CreateCustomsDocumentDto {
  @IsString()
  shipmentId: string;

  @IsEnum(CustomsDocType)
  type: CustomsDocType;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsObject()
  exporterInfo?: Record<string, any>;

  @IsOptional()
  @IsObject()
  importerInfo?: Record<string, any>;

  @IsOptional()
  @IsObject()
  goodsInfo?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomsDocumentDto {
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsEnum(CustomsDocStatus)
  status?: CustomsDocStatus;

  @IsOptional()
  @IsObject()
  exporterInfo?: Record<string, any>;

  @IsOptional()
  @IsObject()
  importerInfo?: Record<string, any>;

  @IsOptional()
  @IsObject()
  goodsInfo?: Record<string, any>;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
