import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PasswordRecoveryService } from "./password-recovery.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { AuthGuard } from "./auth.guard";
import { IsEmail, IsString, MinLength } from "class-validator";

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordRecoveryService: PasswordRecoveryService
  ) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto, @Request() req: any) {
    return this.authService.login(dto, req.ip);
  }

  @UseGuards(AuthGuard)
  @Get("profile")
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post("refresh")
  refresh(@Request() req: any) {
    return this.authService.refresh(req.user.sub);
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordRecoveryService.generateResetToken(dto.email);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordRecoveryService.resetPassword(dto.token, dto.newPassword);
  }

  @Get("validate-reset-token")
  validateResetToken(@Body("token") token: string) {
    return this.passwordRecoveryService.validateResetToken(token);
  }
}
