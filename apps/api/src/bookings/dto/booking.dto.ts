import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum BookingStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  CANCELADO = 'CANCELADO',
  COMPLETADO = 'COMPLETADO',
}

export class CreateBookingDto {
  @IsString()
  shipmentId: string;

  @IsString()
  destinationId: string;

  @IsOptional()
  @IsString()
  bookingNumber?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  containerNumber?: string;

  @IsOptional()
  @IsDateString()
  eta?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsString()
  emotionalNote?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  bookingNumber?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  containerNumber?: string;

  @IsOptional()
  @IsDateString()
  eta?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsString()
  emotionalNote?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
