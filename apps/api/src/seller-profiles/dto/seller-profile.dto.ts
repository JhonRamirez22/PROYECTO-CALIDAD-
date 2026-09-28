import { IsString, IsOptional, IsNumber } from "class-validator";

export class CreateSellerProfileDto {
  @IsString()
  userId: string;

  @IsString()
  farmName: string;

  @IsString()
  farmLocation: string;

  @IsNumber()
  productionCapacity: number;

  @IsString()
  @IsOptional()
  coffeeType?: string;

  @IsString()
  @IsOptional()
  coffeeVariety?: string;

  @IsString()
  @IsOptional()
  qualityGrade?: string;

  @IsString()
  @IsOptional()
  deforestationProof?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSellerProfileDto {
  @IsString()
  @IsOptional()
  farmName?: string;

  @IsString()
  @IsOptional()
  farmLocation?: string;

  @IsNumber()
  @IsOptional()
  productionCapacity?: number;

  @IsString()
  @IsOptional()
  coffeeType?: string;

  @IsString()
  @IsOptional()
  coffeeVariety?: string;

  @IsString()
  @IsOptional()
  qualityGrade?: string;

  @IsString()
  @IsOptional()
  deforestationProof?: string;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
