import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException("El email ya está registrado");

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        // Public sign-up never accepts privileged roles. Internal roles are
        // created through the ADMIN-protected /users endpoint.
        roles: ["COMPRADOR"],
      },
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    if (!user.active) {
      throw new UnauthorizedException("Cuenta desactivada");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        "Cuenta bloqueada temporalmente. Intente más tarde."
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const update: any = { failedAttempts: attempts };
      if (attempts >= 5) {
        update.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: update,
      });
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    if (user.failedAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    return this.generateToken(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, roles: true, active: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException("Usuario no encontrado");
    return user;
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) throw new UnauthorizedException("La sesión no está disponible");
    return this.generateToken(user);
  }

  private generateToken(user: { id: string; email: string; roles: string[] }) {
    const payload = { sub: user.id, email: user.email, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }
}
