import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from "class-validator";

export class CreateLotDto {
  @IsString()
  productId: string;

  @IsNumber()
  weight: number;

  @IsString()
  @IsOptional()
  traceabilityCode?: string;

  @IsOptional()
  harvestDate?: Date;

  @IsOptional()
  processDate?: Date;

  @IsString()
  @IsOptional()
  originLocation?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;
}

export class UpdateLotDto {
  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  harvestDate?: string;

  @IsDateString()
  @IsOptional()
  processDate?: string;

  @IsString()
  @IsOptional()
  originLocation?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class LotFilterDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
