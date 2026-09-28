import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSellerProfileDto, UpdateSellerProfileDto } from "./dto/seller-profile.dto";
import { ConfigService } from "@nestjs/config";
import { FarmCertificatesService } from "../farm-certificates/farm-certificates.service";

@Injectable()
export class SellerProfilesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private farmCertificatesService: FarmCertificatesService,
  ) {}

  async create(dto: CreateSellerProfileDto) {
    return this.prisma.sellerProfile.create({
      data: {
        userId: dto.userId,
        farmName: dto.farmName,
        farmLocation: dto.farmLocation,
        productionCapacity: dto.productionCapacity,
        coffeeType: dto.coffeeType,
        coffeeVariety: dto.coffeeVariety,
        qualityGrade: dto.qualityGrade,
        deforestationProof: dto.deforestationProof,
        bankAccount: dto.bankAccount,
        bankName: dto.bankName,
        notes: dto.notes,
      },
      include: { user: { select: { id: true, email: true, roles: true } } },
    });
  }

  async findAll() {
    return this.prisma.sellerProfile.findMany({
      include: { user: { select: { id: true, email: true, roles: true } } },
    });
  }

  async findOne(id: string) {
    return this.prisma.sellerProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, roles: true } } },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, roles: true } } },
    });
  }

  async update(id: string, dto: UpdateSellerProfileDto) {
    const profile = await this.prisma.sellerProfile.update({
      where: { id },
      data: dto,
      include: { user: { select: { id: true, email: true, roles: true } } },
    });

    // Auto-update onboardingComplete flag
    const complete = await this.checkOnboardingComplete(profile.userId);
    await this.prisma.sellerProfile.update({
      where: { id: profile.id },
      data: { onboardingComplete: complete.complete },
    });

    return this.findByUser(profile.userId);
  }

  async remove(id: string) {
    return this.prisma.sellerProfile.delete({ where: { id } });
  }

  async checkOnboardingComplete(userId: string) {
    const profile = await this.findByUser(userId);
    if (!profile) {
      return { complete: false, missing: ['Perfil no encontrado'] };
    }

    const certs = await this.farmCertificatesService.findBySellerProfile(profile.id);
    const missing: string[] = [];

    if (!profile.productionCapacity) missing.push('Capacidad de producción');
    if (!profile.coffeeType) missing.push('Tipo de café');
    if (!profile.qualityGrade) missing.push('Calidad');
    if (!profile.deforestationProof) missing.push('Prueba sin deforestación');
    if (!profile.bankAccount) missing.push('Cuenta bancaria');

    const hasProductCert = certs.some(c => 
      ['ORGANICO', 'FAIR_TRADE', 'RAINFOREST_ALLIANCE', 'ORIGIN_CERTIFICATION', 'FITOSANITARIO', 'EUD', 'CALIDAD'].includes(c.type)
    );
    const hasFarmCert = certs.some(c => 
      ['FINCA_ORGANICO', 'FINCA_FAIR_TRADE', 'FINCA_RAINFOREST', 'FINCA_EUDR', 'FINCA_SOSTENIBILIDAD', 'FINCA_CAPACIDAD'].includes(c.type)
    );
    const hasDeforestationCert = certs.some(c => c.type === 'FINCA_EUDR');

    if (!hasProductCert) missing.push('Certificados de producto (orgánico, fair trade, origen, etc.)');
    if (!hasFarmCert) missing.push('Certificados de finca (sostenibilidad, capacidad, etc.)');
    if (!hasDeforestationCert) missing.push('Certificado sin deforestación (EUDR)');

    return {
      complete: missing.length === 0,
      missing,
      details: {
        productCerts: hasProductCert,
        farmCerts: hasFarmCert,
        noDeforestation: hasDeforestationCert,
        productionCapacity: !!profile.productionCapacity,
        coffeeType: !!profile.coffeeType,
        qualityGrade: !!profile.qualityGrade,
        bankAccount: !!profile.bankAccount,
      },
    };
  }

  getDefaultCommissionRate(): number {
    return this.config.get<number>('DEFAULT_COMMISSION_RATE') ?? 0.01;
  }

  async calculateCommission(orderTotal: number, sellerId: string): Promise<number> {
    const profile = await this.findByUser(sellerId);
    const rate = profile?.commissionRate ? Number(profile.commissionRate) : this.getDefaultCommissionRate();
    return orderTotal * rate;
  }
}
