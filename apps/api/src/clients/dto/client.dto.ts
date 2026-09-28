import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsDateString } from "class-validator";

export class CreateClientDto {
  @IsString()
  company: string;

  @IsString()
  address: string;

  @IsString()
  country: string;

  @IsString()
  vatId: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateContactDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateContactDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() position?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() role?: string;
  @IsBoolean() @IsOptional() isPrimary?: boolean;
}

export class ClientFilterDto {
  @IsString()
  @IsOptional()
  country?: string;

  @IsEnum(["ACTIVO", "INACTIVO"])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}

export class CreateClientContractDto {
  @IsString()
  contractNumber: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(["BORRADOR", "ACTIVO"])
  @IsOptional()
  status?: string;
}
