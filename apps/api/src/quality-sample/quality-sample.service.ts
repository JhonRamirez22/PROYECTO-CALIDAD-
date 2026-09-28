import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQualitySampleVerificationDto, UpdateQualitySampleVerificationDto } from "./dto/quality-sample.dto";
import { SampleVerificationStatus } from "@prisma/client";

@Injectable()
export class QualitySampleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQualitySampleVerificationDto) {
    return this.prisma.qualitySampleVerification.create({
      data: {
        lotId: dto.lotId,
        verifierId: dto.verifierId || null,
        samplePhoto: dto.samplePhoto,
        sampleNotes: dto.sampleNotes,
      },
      include: {
        lot: { select: { id: true, traceabilityCode: true, product: true } },
        verifier: { select: { id: true, email: true } },
      },
    });
  }

  // Propietario sube su muestra
  async submitOwnerSample(lotId: string, dto: { samplePhoto?: string; sampleNotes?: string }, ownerId: string) {
    const lot = await this.prisma.lot.findUnique({ where: { id: lotId } });
    if (!lot) throw new BadRequestException("Lote no encontrado");

    return this.prisma.qualitySampleVerification.upsert({
      where: { lotId },
      create: {
        lotId,
        ownerSamplePhoto: dto.samplePhoto,
        ownerSampleNotes: dto.sampleNotes,
        status: "PENDIENTE",
      },
      update: {
        ownerSamplePhoto: dto.samplePhoto,
        ownerSampleNotes: dto.sampleNotes,
        status: "PENDIENTE",
      },
      include: {
        lot: { select: { id: true, traceabilityCode: true, product: true } },
      },
    });
  }

  // Verificador (LOGISTICA/ADMIN) compara y verifica igualdad
  async verifyEquality(lotId: string, dto: {
    verifierSamplePhoto?: string;
    verifierSampleNotes?: string;
    matchTolerancePoints?: number;
  }, verifierId: string) {
    const sample = await this.prisma.qualitySampleVerification.findUnique({ where: { lotId } });
    if (!sample) throw new BadRequestException("Verificación de muestra no existe para este lote");

    const tolerance = dto.matchTolerancePoints ?? sample.matchTolerancePoints ?? 2;
    const matches = this.compareSamples(
      { ownerSampleNotes: sample.ownerSampleNotes ?? undefined, ownerSamplePhoto: sample.ownerSamplePhoto ?? undefined },
      dto,
      tolerance,
    );

    return this.prisma.qualitySampleVerification.update({
      where: { lotId },
      data: {
        verifierSamplePhoto: dto.verifierSamplePhoto,
        verifierSampleNotes: dto.verifierSampleNotes,
        matches,
        matchTolerancePoints: tolerance,
        verifiedById: verifierId,
        verifiedAt: new Date(),
        status: matches ? SampleVerificationStatus.APROBADO : SampleVerificationStatus.RECHAZADO,
      },
      include: {
        lot: { select: { id: true, traceabilityCode: true, product: true } },
        verifier: { select: { id: true, email: true } },
      },
    });
  }

  private compareSamples(
    ownerSample: { ownerSampleNotes?: string; ownerSamplePhoto?: string },
    verifierDto: { verifierSampleNotes?: string; verifierSamplePhoto?: string },
    tolerancePoints: number
  ): boolean {
    // Lógica de comparación simplificada:
    // 1. Si hay notas en ambas, comparar similitud textual (keywords SCA)
    // 2. Si hay fotos, comparación visual futura (placeholder)
    // Por ahora: coincide si ambas tienen notas y comparten al menos 2 keywords SCA

    const ownerNotes = ownerSample.ownerSampleNotes?.toLowerCase() || '';
    const verifierNotes = verifierDto.verifierSampleNotes?.toLowerCase() || '';

    if (!ownerNotes && !verifierNotes) return true; // Sin notas = pasa
    if (!ownerNotes || !verifierNotes) return false; // Una tiene notas, otra no = no coincide

    const scaKeywords = ['fragrance', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'uniformity', 'sweetness', 'clean cup', 'overall', 'defectos'];
    const ownerKeywords = scaKeywords.filter(k => ownerNotes.includes(k));
    const verifierKeywords = scaKeywords.filter(k => verifierNotes.includes(k));
    const commonKeywords = ownerKeywords.filter(k => verifierKeywords.includes(k));

    // Coincide si comparten al menos 2 keywords SCA
    return commonKeywords.length >= 2;
  }

  async findAll() {
    return this.prisma.qualitySampleVerification.findMany({
      include: {
        lot: { select: { id: true, traceabilityCode: true, product: true } },
        verifier: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.qualitySampleVerification.findUnique({
      where: { id },
      include: {
        lot: { select: { id: true, traceabilityCode: true, product: true } },
        verifier: { select: { id: true, email: true } },
      },
    });
  }

  async findByLot(lotId: string) {
    return this.prisma.qualitySampleVerification.findMany({
      where: { lotId },
      include: {
        lot: { select: { id: true, traceabilityCode: true } },
        verifier: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, dto: UpdateQualitySampleVerificationDto) {
    return this.prisma.qualitySampleVerification.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as any }),
        ...(dto.samplePhoto !== undefined && { samplePhoto: dto.samplePhoto }),
        ...(dto.sampleNotes !== undefined && { sampleNotes: dto.sampleNotes }),
        ...(dto.verifiedAt && { verifiedAt: new Date(dto.verifiedAt) }),
        ...(dto.rejectReason !== undefined && { rejectReason: dto.rejectReason }),
      },
      include: {
        lot: { select: { id: true, traceabilityCode: true } },
        verifier: { select: { id: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.qualitySampleVerification.delete({ where: { id } });
  }
}
