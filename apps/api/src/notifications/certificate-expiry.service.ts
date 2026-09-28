import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EmailService } from "../email/email.service";
import { NotificationType, NotificationPriority } from "@prisma/client";

@Injectable()
export class CertificateExpiryService {
  private readonly logger = new Logger(CertificateExpiryService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  @Cron("0 8 * * *")
  async checkExpiringCertificates() {
    this.logger.log("Running certificate expiry check...");

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringCerts = await this.prisma.farmCertificate.findMany({
      where: {
        expiresAt: {
          not: null,
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        sellerProfile: true,
      },
    });

    this.logger.log(`Found ${expiringCerts.length} certificates expiring within 30 days`);

    for (const cert of expiringCerts) {
      if (!cert.expiresAt) continue;

      const daysUntilExpiry = Math.ceil(
        (cert.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const priority =
        daysUntilExpiry <= 7 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM;

      const certLabel = `${cert.type} N.º ${cert.number}`;
      const farmName = cert.sellerProfile?.farmName || "Finca desconocida";

      const users = await this.prisma.user.findMany({
        where: { roles: { hasSome: ["ADMIN", "PROPIETARIO"] } },
        select: { id: true, email: true },
      });

      for (const user of users) {
        await this.notificationsService.create({
          userId: user.id,
          type: NotificationType.CERTIFICATE_EXPIRY,
          title: `Certificado por vencer: ${certLabel}`,
          message: `El certificado "${certLabel}" de ${farmName} vence en ${daysUntilExpiry} días (${cert.expiresAt.toLocaleDateString("es-CO")}).`,
          priority,
          link: `/farm-certificates`,
        });

        const prefs = await this.notificationsService.getPreferences(user.id);
        if (prefs.certificateExpiryEmail && user.email) {
          await this.emailService.sendCertificateExpiryAlert({
            to: user.email,
            productName: farmName,
            certificateName: certLabel,
            expiryDate: cert.expiresAt.toLocaleDateString("es-CO"),
            daysUntilExpiry,
          });
        }
      }
    }

    this.logger.log("Certificate expiry check completed");
  }
}
