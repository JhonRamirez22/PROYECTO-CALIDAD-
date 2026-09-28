import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

function IntScore() {
  return function (target: any, propertyKey: string) {
    Type(() => Number)(target, propertyKey);
    IsInt()(target, propertyKey);
    Min(0)(target, propertyKey);
    Max(10)(target, propertyKey);
  };
}

export class CreateQualityAnalysisDto {
  @IsString() lotId: string;
  @IsString() analyst: string;

  // Protocolo SCA de catación: cada atributo se califica de 0 a 10
  @IntScore() fragrance: number;
  @IntScore() flavor: number;
  @IntScore() aftertaste: number;
  @IntScore() acidity: number;
  @IntScore() body: number;
  @IntScore() balance: number;
  // Uniformity, sweetness y clean cup se puntúan por taza (x10 en protocolo
  // oficial); aquí se registra el promedio por simplicidad del registro
  @IntScore() uniformity: number;
  @IntScore() sweetness: number;
  @IntScore() cleanCup: number;
  @IntScore() overall: number;

  @IsOptional() @IsInt() @Min(0) defects?: number;
  @IsOptional() @IsString() notes?: string;
}

export class QualityAnalysisFilterDto {
  @IsOptional() @IsString() lotId?: string;
}
