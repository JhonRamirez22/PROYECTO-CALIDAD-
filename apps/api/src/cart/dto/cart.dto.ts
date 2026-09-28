import { IsString, IsOptional, IsNumber, Min } from "class-validator";

export class AddCartItemDto {
  @IsString()
  sessionId: string;

  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  lotId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
