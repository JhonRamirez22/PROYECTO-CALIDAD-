import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsArray } from 'class-validator';

export enum ContainerType {
  REFRIGERADO_20 = 'REFRIGERADO_20',
  REFRIGERADO_40 = 'REFRIGERADO_40',
  ESTANDAR_20 = 'ESTANDAR_20',
  ESTANDAR_40 = 'ESTANDAR_40',
  HC_40 = 'HC_40',
  GRANELERO = 'GRANELERO',
}

export enum ShipmentMode {
  FTL = 'FTL',
  LCL = 'LCL',
}

export enum Incoterm {
  FOB = 'FOB',
  CFR = 'CFR',
  CIF = 'CIF',
  EXW = 'EXW',
  FCA = 'FCA',
  CPT = 'CPT',
  CIP = 'CIP',
  DAP = 'DAP',
  DDP = 'DDP',
  DPU = 'DPU',
}

export class CreateShippingDestinationDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  portCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  requiresTempControl?: boolean;

  @IsOptional()
  @IsNumber()
  tempMinC?: number;

  @IsOptional()
  @IsNumber()
  tempMaxC?: number;

  @IsOptional()
  @IsEnum(ContainerType)
  defaultContainer?: ContainerType;

  @IsOptional()
  @IsEnum(ShipmentMode)
  defaultMode?: ShipmentMode;

  @IsOptional()
  @IsEnum(Incoterm)
  incotermDefault?: Incoterm;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificateFormats?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShippingDestinationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  portCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  requiresTempControl?: boolean;

  @IsOptional()
  @IsNumber()
  tempMinC?: number;

  @IsOptional()
  @IsNumber()
  tempMaxC?: number;

  @IsOptional()
  @IsEnum(ContainerType)
  defaultContainer?: ContainerType;

  @IsOptional()
  @IsEnum(ShipmentMode)
  defaultMode?: ShipmentMode;

  @IsOptional()
  @IsEnum(Incoterm)
  incotermDefault?: Incoterm;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificateFormats?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
