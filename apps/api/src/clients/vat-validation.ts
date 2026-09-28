import { BadRequestException } from "@nestjs/common";

const RULES: Record<string, { prefix: string; pattern: RegExp }> = {
  alemania: { prefix: "DE", pattern: /^DE\d{9}$/ },
  austria: { prefix: "AT", pattern: /^ATU\d{8}$/ },
  belgica: { prefix: "BE", pattern: /^BE0?\d{9}$/ },
  bulgaria: { prefix: "BG", pattern: /^BG\d{9,10}$/ },
  chipre: { prefix: "CY", pattern: /^CY\d{8}[A-Z]$/ },
  croacia: { prefix: "HR", pattern: /^HR\d{11}$/ },
  dinamarca: { prefix: "DK", pattern: /^DK\d{8}$/ },
  eslovaquia: { prefix: "SK", pattern: /^SK\d{10}$/ },
  eslovenia: { prefix: "SI", pattern: /^SI\d{8}$/ },
  espana: { prefix: "ES", pattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/ },
  estonia: { prefix: "EE", pattern: /^EE\d{9}$/ },
  finlandia: { prefix: "FI", pattern: /^FI\d{8}$/ },
  francia: { prefix: "FR", pattern: /^FR[A-Z0-9]{2}\d{9}$/ },
  grecia: { prefix: "EL", pattern: /^EL\d{9}$/ },
  hungria: { prefix: "HU", pattern: /^HU\d{8}$/ },
  irlanda: { prefix: "IE", pattern: /^IE[A-Z0-9]{8,9}$/ },
  italia: { prefix: "IT", pattern: /^IT\d{11}$/ },
  letonia: { prefix: "LV", pattern: /^LV\d{11}$/ },
  lituania: { prefix: "LT", pattern: /^LT(\d{9}|\d{12})$/ },
  luxemburgo: { prefix: "LU", pattern: /^LU\d{8}$/ },
  malta: { prefix: "MT", pattern: /^MT\d{8}$/ },
  paisesbajos: { prefix: "NL", pattern: /^NL\d{9}B\d{2}$/ },
  polonia: { prefix: "PL", pattern: /^PL\d{10}$/ },
  portugal: { prefix: "PT", pattern: /^PT\d{9}$/ },
  republicacheca: { prefix: "CZ", pattern: /^CZ\d{8,10}$/ },
  rumania: { prefix: "RO", pattern: /^RO\d{2,10}$/ },
  suecia: { prefix: "SE", pattern: /^SE\d{12}$/ },
};

const COUNTRY_ALIASES: Record<string, string> = {
  austria: "austria",
  belgium: "belgica",
  belgique: "belgica",
  belgien: "belgica",
  czechia: "republicacheca",
  czechrepublic: "republicacheca",
  deutschland: "alemania",
  denmark: "dinamarca",
  france: "francia",
  germany: "alemania",
  greece: "grecia",
  hellas: "grecia",
  ireland: "irlanda",
  italy: "italia",
  netherlands: "paisesbajos",
  holland: "paisesbajos",
  poland: "polonia",
  portugal: "portugal",
  spain: "espana",
  sweden: "suecia",
};

function normalizeCountry(country: string): string {
  const normalized = country
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  return COUNTRY_ALIASES[normalized] ?? normalized;
}

export function normalizeAndValidateVatId(country: string, vatId: string): string {
  const rule = RULES[normalizeCountry(country)];
  const normalizedVatId = vatId.toUpperCase().replace(/[\s.-]/g, "");
  if (!rule) {
    throw new BadRequestException(
      `No hay una regla de validación VAT configurada para ${country}`,
    );
  }
  if (!rule.pattern.test(normalizedVatId)) {
    throw new BadRequestException(
      `El VAT ID no tiene un formato válido para ${country} (prefijo ${rule.prefix})`,
    );
  }
  return normalizedVatId;
}
