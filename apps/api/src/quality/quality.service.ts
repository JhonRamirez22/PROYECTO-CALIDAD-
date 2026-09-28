import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateQualityAnalysisDto,
  QualityAnalysisFilterDto,
} from "./dto/quality-analysis.dto";

@Injectable()
export class QualityService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQualityAnalysisDto) {
    const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId } });
    if (!lot) throw new NotFoundException("Lote no encontrado");

    const totalScore =
      dto.fragrance +
      dto.flavor +
      dto.aftertaste +
      dto.acidity +
      dto.body +
      dto.balance +
      dto.uniformity +
      dto.sweetness +
      dto.cleanCup +
      dto.overall;

    return this.prisma.qualityAnalysis.create({
      data: {
        lotId: dto.lotId,
        analyst: dto.analyst,
        fragrance: dto.fragrance,
        flavor: dto.flavor,
        aftertaste: dto.aftertaste,
        acidity: dto.acidity,
        body: dto.body,
        balance: dto.balance,
        uniformity: dto.uniformity,
        sweetness: dto.sweetness,
        cleanCup: dto.cleanCup,
        overall: dto.overall,
        totalScore,
        defects: dto.defects ?? 0,
        notes: dto.notes,
      },
      include: { lot: { include: { product: true } } },
    });
  }

  async findAll(filters?: QualityAnalysisFilterDto) {
    const where: any = {};
    if (filters?.lotId) where.lotId = filters.lotId;

    return this.prisma.qualityAnalysis.findMany({
      where,
      include: { lot: { include: { product: true } } },
      orderBy: [{ analyzedAt: "desc" }],
    });
  }

  async findOne(id: string) {
    const analysis = await this.prisma.qualityAnalysis.findUnique({
      where: { id },
      include: { lot: { include: { product: true } } },
    });
    if (!analysis) throw new NotFoundException("Análisis no encontrado");
    return analysis;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.qualityAnalysis.delete({ where: { id } });
  }
}
