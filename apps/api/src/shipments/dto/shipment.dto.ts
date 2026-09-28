import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsArray, IsNumber } from 'class-validator';

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

export enum ShipmentStatus {
  BORRADOR = 'BORRADOR',
  CONSOLIDADO = 'CONSOLIDADO',
  CONFIRMADO = 'CONFIRMADO',
  EN_TRANSITO = 'EN_TRANSITO',
  EN_ADUANA = 'EN_ADUANA',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export class CreateShipmentDto {
  @IsString()
  destinationId: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsEnum(ContainerType)
  containerType?: ContainerType;

  @IsOptional()
  @IsString()
  containerNumber?: string;

  @IsOptional()
  @IsEnum(ShipmentMode)
  mode?: ShipmentMode;

  @IsOptional()
  @IsBoolean()
  needsTempControl?: boolean;

  @IsOptional()
  @IsNumber()
  tempMinC?: number;

  @IsOptional()
  @IsNumber()
  tempMaxC?: number;

  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @IsOptional()
  @IsString()
  insurancePolicy?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  orderIds: string[];
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsEnum(ContainerType)
  containerType?: ContainerType;

  @IsOptional()
  @IsString()
  containerNumber?: string;

  @IsOptional()
  @IsEnum(ShipmentMode)
  mode?: ShipmentMode;

  @IsOptional()
  @IsBoolean()
  needsTempControl?: boolean;

  @IsOptional()
  @IsNumber()
  tempMinC?: number;

  @IsOptional()
  @IsNumber()
  tempMaxC?: number;

  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @IsOptional()
  @IsString()
  insurancePolicy?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderIds?: string[];
}

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;
}
