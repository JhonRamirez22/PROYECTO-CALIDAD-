import { IsString, IsOptional } from "class-validator";

export class CreateCheckoutSessionDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;
}
