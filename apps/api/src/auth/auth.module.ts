import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles.guard";
import { PasswordRecoveryService } from "./password-recovery.service";
import { randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(48).toString("base64url");

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production");
}

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard, PasswordRecoveryService],
  exports: [AuthGuard, RolesGuard],
})
export class AuthModule {}
