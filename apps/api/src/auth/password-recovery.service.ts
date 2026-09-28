import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { randomBytes } from "crypto";

@Injectable()
export class PasswordRecoveryService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async generateResetToken(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: "Si el email existe, recibirás un enlace de recuperación" };
    }

    // Invalidate any existing tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO(RITECH-XXX): Send email with reset link
    // For now, log the token for development
    console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);
    console.log(`[PASSWORD RESET] Reset URL: http://localhost:3000/reset-password?token=${token}`);

    return { message: "Si el email existe, recibirás un enlace de recuperación" };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException("Token y nueva contraseña son requeridos");
    }

    if (newPassword.length < 8) {
      throw new BadRequestException("La contraseña debe tener al menos 8 caracteres");
    }

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException("Token inválido");
    }

    if (resetToken.used) {
      throw new BadRequestException("Token ya utilizado");
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException("Token expirado");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          failedAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { message: "Contraseña actualizada correctamente" };
  }

  async validateResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return { valid: false };
    }

    return { valid: true, email: undefined }; // Don't expose email
  }
}
