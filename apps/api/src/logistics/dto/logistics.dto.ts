import { IsString, IsOptional, IsEnum } from "class-validator";

export class CreateLogisticsEntryDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  transporter?: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  originPort?: string;

  @IsString()
  @IsOptional()
  destPort?: string;

  @IsString()
  @IsOptional()
  departureDate?: string;

  @IsString()
  @IsOptional()
  arrivalDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateLogisticsEntryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  transporter?: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  originPort?: string;

  @IsString()
  @IsOptional()
  destPort?: string;

  @IsString()
  @IsOptional()
  departureDate?: string;

  @IsString()
  @IsOptional()
  arrivalDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
