import { IsString, IsOptional } from "class-validator";

export class CreateQualitySampleVerificationDto {
  @IsString()
  lotId: string;

  @IsString()
  @IsOptional()
  verifierId?: string;

  @IsString()
  @IsOptional()
  samplePhoto?: string;

  @IsString()
  @IsOptional()
  sampleNotes?: string;
}

export class UpdateQualitySampleVerificationDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  samplePhoto?: string;

  @IsString()
  @IsOptional()
  sampleNotes?: string;

  @IsString()
  @IsOptional()
  verifiedAt?: string;

  @IsString()
  @IsOptional()
  rejectReason?: string;
}
