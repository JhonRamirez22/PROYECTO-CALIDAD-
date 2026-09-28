import { IsDateString } from "class-validator";

export class CreateProformaDto {
  @IsDateString()
  validUntil: string;
}
