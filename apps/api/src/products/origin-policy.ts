import { BadRequestException } from "@nestjs/common";

export const NARINO_PRODUCT_ORIGIN = "Nariño, Colombia";

export function isNarinoOrigin(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /\bnarino\b/i.test(normalized);
}

export function requireNarinoOrigin(value: string | null | undefined): void {
  if (!isNarinoOrigin(value)) {
    throw new BadRequestException(
      "RiTech solo admite café y cacao con origen en Nariño, Colombia.",
    );
  }
}
