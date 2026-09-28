import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFarmCertificateDto, UpdateFarmCertificateDto } from "./dto/farm-certificate.dto";

@Injectable()
export class FarmCertificatesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFarmCertificateDto) {
    return this.prisma.farmCertificate.create({
      data: {
        sellerProfileId: dto.sellerProfileId,
        type: dto.type as any,
        number: dto.number,
        issuer: dto.issuer,
        issuedAt: new Date(dto.issuedAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
      },
      include: { sellerProfile: { include: { user: { select: { id: true, email: true } } } } },
    });
  }

  async findAll() {
    return this.prisma.farmCertificate.findMany({
      include: { sellerProfile: { include: { user: { select: { id: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.farmCertificate.findUnique({
      where: { id },
      include: { sellerProfile: { include: { user: { select: { id: true, email: true } } } } },
    });
  }

  async findBySellerProfile(sellerProfileId: string) {
    return this.prisma.farmCertificate.findMany({
      where: { sellerProfileId },
      include: { sellerProfile: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, dto: UpdateFarmCertificateDto) {
    return this.prisma.farmCertificate.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type as any }),
        ...(dto.number && { number: dto.number }),
        ...(dto.issuer && { issuer: dto.issuer }),
        ...(dto.issuedAt && { issuedAt: new Date(dto.issuedAt) }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { sellerProfile: true },
    });
  }

  async remove(id: string) {
    return this.prisma.farmCertificate.delete({ where: { id } });
  }

  async hasValidOriginCert(sellerProfileId: string): Promise<boolean> {
    const cert = await this.prisma.farmCertificate.findFirst({
      where: {
        sellerProfileId,
        type: "ORIGIN_CERTIFICATION",
        expiresAt: { gte: new Date() },
      },
    });
    return !!cert;
  }
}
