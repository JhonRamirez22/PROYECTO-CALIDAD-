import { IsString, IsEnum, IsOptional, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";

export class CreateProductDto {
  @IsString()
  name: string;

  @IsEnum(["CAFE", "CACAO"])
  type: string;

  @IsString()
  variety: string;

  @IsString()
  origin: string;

  @IsString()
  @IsOptional()
  altitude?: string;

  @IsString()
  @IsOptional()
  process?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(["CAFE", "CACAO"])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  variety?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  altitude?: string;

  @IsString()
  @IsOptional()
  process?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  active?: boolean;
}

export class ProductFilterDto {
  @IsEnum(["CAFE", "CACAO"])
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  variety?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => value === "true" ? true : value === "false" ? false : value)
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
