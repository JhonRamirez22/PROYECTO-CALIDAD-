import { BadRequestException } from "@nestjs/common";
import { normalizeAndValidateVatId } from "./vat-validation";

describe("normalizeAndValidateVatId", () => {
  it("normalizes separators and validates a German VAT ID", () => {
    expect(normalizeAndValidateVatId("Alemania", "de 123 456 789")).toBe("DE123456789");
  });

  it("validates the country-specific suffix format for the Netherlands", () => {
    expect(normalizeAndValidateVatId("Países Bajos", "NL123456789B01")).toBe("NL123456789B01");
  });

  it("rejects a VAT ID whose prefix does not match the selected country", () => {
    expect(() => normalizeAndValidateVatId("Alemania", "NL123456789B01")).toThrow(BadRequestException);
  });

  it("reports countries without a configured format rather than accepting an unchecked value", () => {
    expect(() => normalizeAndValidateVatId("Islandia", "IS123456")).toThrow(BadRequestException);
  });
});
