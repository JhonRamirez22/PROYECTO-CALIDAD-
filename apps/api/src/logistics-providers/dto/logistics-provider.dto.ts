import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsNumber } from 'class-validator';

export enum ProviderType {
  TRANSPORTISTA = 'TRANSPORTISTA',
  ASEGURADORA = 'ASEGURADORA',
  TRANSITARIO = 'TRANSITARIO',
}

export class CreateLogisticsProviderDto {
  @IsString()
  name: string;

  @IsEnum(ProviderType)
  type: ProviderType;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsDateString()
  policyExpiry?: string;

  @IsOptional()
  @IsNumber()
  insuredAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLogisticsProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProviderType)
  type?: ProviderType;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsDateString()
  policyExpiry?: string;

  @IsOptional()
  @IsNumber()
  insuredAmount?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
