import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly smtpHost = process.env.SMTP_HOST;
  private readonly smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  private readonly smtpUser = process.env.SMTP_USER;
  private readonly smtpPass = process.env.SMTP_PASS;
  private readonly emailFrom = process.env.EMAIL_FROM || "noreply@ritech.com";

  async sendMail(data: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: { filename: string; content: Buffer; contentType: string }[];
  }): Promise<boolean> {
    const recipients = Array.isArray(data.to) ? data.to : [data.to];

    if (!this.smtpHost) {
      this.logger.warn(
        `[EmailService] SMTP not configured — email to ${recipients.join(", ")} skipped: "${data.subject}"`,
      );
      return false;
    }

    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpPort === 465,
        auth: {
          user: this.smtpUser,
          pass: this.smtpPass,
        },
      });

      await transporter.sendMail({
        from: this.emailFrom,
        to: recipients.join(", "),
        subject: data.subject,
        html: data.html,
        text: data.text,
        attachments: data.attachments,
      });

      this.logger.log(`Email sent to ${recipients.join(", ")}: "${data.subject}"`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${recipients.join(", ")}: ${error}`);
      return false;
    }
  }

  async sendOrderStatusChange(data: {
    to: string | string[];
    orderNumber: string;
    oldStatus: string;
    newStatus: string;
    clientCompany?: string;
  }): Promise<boolean> {
    const statusLabels: Record<string, string> = {
      CONFIRMADO: "Confirmado",
      PENDIENTE_APROBACION: "Pendiente de Aprobación",
      ENVIADO: "Enviado",
      ENTREGADO: "Entregado",
      CANCELADO: "Cancelado",
      RECHAZADO: "Rechazado",
      BORRADOR: "Borrador",
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">Cambio de Estado - Pedido ${data.orderNumber}</h2>
        <p>El pedido <strong>${data.orderNumber}</strong>${data.clientCompany ? ` de ${data.clientCompany}` : ""} ha cambiado de estado:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Estado anterior:</strong> ${statusLabels[data.oldStatus] || data.oldStatus}</p>
          <p style="margin: 5px 0 0;"><strong>Estado nuevo:</strong> ${statusLabels[data.newStatus] || data.newStatus}</p>
        </div>
        <p style="color: #666; font-size: 12px;">Este es un email automático de RiTech Export System.</p>
      </div>
    `;

    return this.sendMail({
      to: data.to,
      subject: `[RiTech] Pedido ${data.orderNumber} - ${statusLabels[data.newStatus] || data.newStatus}`,
      html,
    });
  }

  async sendCertificateExpiryAlert(data: {
    to: string | string[];
    productName: string;
    certificateName: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }): Promise<boolean> {
    const urgency =
      data.daysUntilExpiry <= 7 ? "URGENTE" : data.daysUntilExpiry <= 30 ? "AVISO" : "RECORDATORIO";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">${urgency} - Certificado por Vencer</h2>
        <p>El certificado <strong>${data.certificateName}</strong> del producto <strong>${data.productName}</strong> vence en <strong>${data.daysUntilExpiry} días</strong>.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Fecha de vencimiento:</strong> ${data.expiryDate}</p>
          <p style="margin: 5px 0 0;"><strong>Días restantes:</strong> ${data.daysUntilExpiry}</p>
        </div>
        <p>Por favor, gestione la renovación antes del vencimiento.</p>
        <p style="color: #666; font-size: 12px;">Este es un email automático de RiTech Export System.</p>
      </div>
    `;

    return this.sendMail({
      to: data.to,
        subject: `[RiTech] ${urgency} - Certificado "${data.certificateName}" vence en ${data.daysUntilExpiry} días`,
      html,
    });
  }
}
