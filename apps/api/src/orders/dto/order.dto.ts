import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  lotId?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  packageCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  grossWeight?: number;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsString()
  @IsOptional()
  marks?: string;
}

export class CreateOrderDto {
  @IsString()
  clientId: string;

  @IsString()
  @IsOptional()
  sellerId?: string;

  @IsEnum(["FOB", "CFR", "CIF", "EXW", "FCA", "CPT", "CIP", "DAP", "DDP", "DPU"])
  @IsOptional()
  incoterm?: string;

  @IsEnum(["EUR", "USD", "COP"])
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(["BORRADOR", "PENDIENTE_APROBACION", "CONFIRMADO", "RECHAZADO", "ENVIADO", "ENTREGADO", "CANCELADO"])
  status: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateOrderLotDto {
  @IsString()
  lotId: string;
}

export class UpdateOrderPackingDto {
  @IsInt()
  @Min(1)
  packageCount: number;

  @IsNumber()
  @Min(0.01)
  grossWeight: number;

  @IsString()
  dimensions: string;

  @IsString()
  @IsOptional()
  marks?: string;
}

export class OrderFilterDto {
  @IsEnum([
    "BORRADOR",
    "PENDIENTE_APROBACION",
    "CONFIRMADO",
    "RECHAZADO",
    "ENVIADO",
    "ENTREGADO",
    "CANCELADO",
  ])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  sellerId?: string;
}
